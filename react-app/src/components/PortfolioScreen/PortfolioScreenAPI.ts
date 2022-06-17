import { useCallback, useEffect, useState } from "react";
import { useCosmosAPI } from "../../api/cosmosAPI";
import { useQueryClient } from "../../providers/QueryClientProvider";
import { ConnectionStatus, useWallet } from "../../providers/WalletProvider";
import { translateAddress } from "../../utils/address";
import { useStakingAPI } from "../../api/stakingAPI";
import {
  RequestState,
  RequestStateError,
  RequestStateInitial,
  RequestStateLoaded,
  RequestStateLoading,
} from "../../models/RequestState";
import { Portfolio } from "./PortfolioScreenModel";

type PortfolioRequestState = RequestState<Portfolio | null>;

export function usePortfolioQuery(): PortfolioRequestState {
  const [requestState, setRequestState] =
    useState<PortfolioRequestState>(RequestStateInitial);

  const wallet = useWallet();
  const cosmosAPI = useCosmosAPI();
  const staking = useStakingAPI();
  const { desmosQuery } = useQueryClient();

  const fetchPortfolio = useCallback(async () => {
    setRequestState(RequestStateLoading);
    if (wallet.status !== ConnectionStatus.Connected) {
      setRequestState(RequestStateError(new Error("Wallet not connected.")));
      return;
    }
    try {
      const [balance, stakedBalance, unstakingBalance, profile] =
        await Promise.all([
          cosmosAPI.getBalance(),
          cosmosAPI.getStakedBalance(),
          staking.getUnstakingAmount(wallet.account.address),
          desmosQuery.getProfile(
            translateAddress(wallet.account.address, "desmos")
          ),
        ]);

      const availableBalance = {
        amount: balance.amount
          .minus(stakedBalance.amount)
          .minus(unstakingBalance.amount),
        denom: balance.denom,
      };

      setRequestState(
        RequestStateLoaded({
          profile,
          balance,
          stakedBalance,
          unstakingBalance,
          availableBalance,
          address: wallet.account.address,
        })
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setRequestState(RequestStateError(err));
      }
      console.log("Failed to handle fetch portfolio error =", err);
    }
  }, [wallet, cosmosAPI, staking, desmosQuery, setRequestState]);

  useEffect(() => {
    fetchPortfolio().catch((err) => {
      setRequestState(RequestStateError(err));
    });
  }, [fetchPortfolio]);

  return requestState;
}
