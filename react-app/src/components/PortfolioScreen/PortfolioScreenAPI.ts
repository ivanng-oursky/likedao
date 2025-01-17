import { useCallback, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import { useQueryClient } from "../../providers/QueryClientProvider";
import { ConnectionStatus, useWallet } from "../../providers/WalletProvider";
import { translateAddress, truncateAddress } from "../../utils/address";
import { useStakingAPI } from "../../api/stakingAPI";
import {
  isRequestStateLoaded,
  RequestState,
  RequestStateError,
  RequestStateInitial,
  RequestStateLoaded,
  RequestStateLoading,
} from "../../models/RequestState";
import { useDistributionAPI } from "../../api/distributionAPI";
import { ColumnOrder } from "../SectionedTable/SectionedTable";
import { useBankAPI } from "../../api/bankAPI";
import PortfolioScreenModel, { Portfolio, Stake } from "./PortfolioScreenModel";

type PortfolioScreenRequestState = RequestState<PortfolioScreenModel>;

export const usePortfolioQuery = (): {
  requestState: PortfolioScreenRequestState;
  fetch: (address?: string) => Promise<void>;
  stakesOrder: ColumnOrder;
  setStakesOrder: (order: ColumnOrder) => void;
} => {
  const [requestState, setRequestState] =
    useState<PortfolioScreenRequestState>(RequestStateInitial);

  const wallet = useWallet();
  const bankAPI = useBankAPI();
  const stakingAPI = useStakingAPI();
  const distribution = useDistributionAPI();
  const { desmosQuery, query } = useQueryClient();

  const [stakesOrder, setStakesOrder] = useState({
    id: "name",
    direction: "asc" as ColumnOrder["direction"],
  });

  const isValidAddress = useCallback(
    async (address: string) => {
      try {
        const account = await query.auth.account(address);
        return account != null;
      } catch {
        return false;
      }
    },
    [query]
  );

  const fetchAddressPortfolio = useCallback<
    (address: string) => Promise<Portfolio>
  >(
    async (address) => {
      const [
        availableBalance,
        stakedBalance,
        unstakingBalance,
        commission,
        reward,
        profile,
      ] = await Promise.all([
        bankAPI.getAddressBalance(address),
        stakingAPI.getAddressStakedBalance(address),
        stakingAPI.getUnstakingAmount(address),
        distribution.getAddressTotalCommission(address),
        distribution.getAddressTotalDelegationRewards(address),
        desmosQuery.getProfile(translateAddress(address, "desmos")),
      ]);

      const balance = {
        amount: BigNumber.sum(
          availableBalance.amount,
          stakedBalance.amount,
          unstakingBalance.amount
        ),
        denom: availableBalance.denom,
      };

      return {
        profile,
        balance,
        stakedBalance,
        unstakingBalance,
        availableBalance,
        commission,
        reward,
        address,
      };
    },
    [bankAPI, stakingAPI, distribution, desmosQuery]
  );

  const fetchStakes = useCallback(
    async (address: string) => {
      // get stakes amount and validator address of each delegation
      const delegations = await stakingAPI.getDelegatorStakes(address);

      // get rewards of each delegations
      const validatorAddresses = delegations.map(
        (delegation) => delegation.delegation.validatorAddress
      );

      const rewards = await distribution.getDelegationRewardsByValidators(
        address,
        validatorAddresses
      );

      // merge stakes and delegation rewards into stake entries
      const stakeEntries: Stake[] = delegations.map((delegation, i) => ({
        ...delegation,
        reward: rewards[i],
        validator: {
          moniker: `validator ${i + 1}`,
        },
      }));

      return stakeEntries;
    },
    [distribution, stakingAPI]
  );

  const fetch = useCallback(
    async (address?: string) => {
      setRequestState(RequestStateLoading);

      try {
        if (address) {
          if (!(await isValidAddress(address))) {
            throw new Error("Invalid address");
          }
          const portfolio = await fetchAddressPortfolio(address);
          const stakes = await fetchStakes(address);
          setRequestState(RequestStateLoaded({ portfolio, stakes }));
        } else {
          if (wallet.status !== ConnectionStatus.Connected) {
            throw new Error("Wallet not connected.");
          }
          const portfolio = await fetchAddressPortfolio(wallet.account.address);
          const stakes = await fetchStakes(wallet.account.address);
          setRequestState(RequestStateLoaded({ portfolio, stakes }));
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setRequestState(RequestStateError(err));
        }
        console.error("Failed to handle fetch portfolio error =", err);
      }
    },
    [fetchAddressPortfolio, fetchStakes, isValidAddress, wallet]
  );

  const requestStateSorted = useMemo(() => {
    if (!isRequestStateLoaded(requestState)) {
      return requestState;
    }
    return RequestStateLoaded({
      ...requestState.data,
      stakes: requestState.data.stakes.sort((a, b) => {
        switch (stakesOrder.id) {
          case "name":
            return (
              (
                a.validator.moniker ??
                truncateAddress(a.delegation.validatorAddress)
              ).localeCompare(
                b.validator.moniker ??
                  truncateAddress(b.delegation.validatorAddress)
              ) * (stakesOrder.direction === "asc" ? 1 : -1)
            );
          case "staked":
            return (
              a.balance.amount.minus(b.balance.amount).toNumber() *
              (stakesOrder.direction === "asc" ? 1 : -1)
            );
          case "rewards":
            return (
              a.reward.amount.minus(b.reward.amount).toNumber() *
              (stakesOrder.direction === "asc" ? 1 : -1)
            );
          default:
            return 1;
        }
      }),
    });
  }, [stakesOrder.direction, stakesOrder.id, requestState]);

  return {
    requestState: requestStateSorted,
    fetch,
    stakesOrder,
    setStakesOrder,
  };
};
