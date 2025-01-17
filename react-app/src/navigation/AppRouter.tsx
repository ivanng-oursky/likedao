import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import CreateProposalScreen from "../components/CreateProposalScreen/CreateProposalScreen";
import DummyScreen from "../components/DummyScreen/DummyScreen";
import ErrorView, { ErrorType } from "../components/ErrorView/ErrorView";
import OverviewScreen from "../components/OverviewScreen/OverviewScreen";
import PortfolioScreen from "../components/PortfolioScreen/PortfolioScreen";
import ProposalScreen from "../components/ProposalScreen/ProposalScreen";
import WalletConnectingScreen from "../components/WalletConnectingScreen/WalletConnectingScreen";
import { useWallet, ConnectionStatus } from "../providers/WalletProvider";
import AppScaffold from "../components/AppScaffold/AppScaffold";
import ProposalDetailRouter from "../components/ProposalDetailScreen/ProposalDetailRouter";
import ValidatorDetailScreen from "../components/ValidatorDetailScreen/ValidatorDetailScreen";
import AppRoutes from "./AppRoutes";

const AppRouter: React.FC = () => {
  const wallet = useWallet();
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppScaffold />}>
          <Route path={AppRoutes.Overview} element={<OverviewScreen />} />
          <Route path={AppRoutes.Dummy} element={<DummyScreen />} />
          <Route path={AppRoutes.Proposals} element={<ProposalScreen />} />
          <Route
            path={AppRoutes.NewProposal}
            element={<CreateProposalScreen />}
          />
          <Route
            path={`${AppRoutes.ProposalDetail}/*`}
            element={<ProposalDetailRouter />}
          />
          <Route
            path={`${AppRoutes.ValidatorDetail}/*`}
            element={<ValidatorDetailScreen />}
          />
          <Route path={AppRoutes.Portfolio} element={<PortfolioScreen />} />
          <Route
            path={AppRoutes.OtherPortfolio}
            element={<PortfolioScreen />}
          />
        </Route>

        <Route
          path={AppRoutes.NotFound}
          element={<ErrorView type={ErrorType.NotFound} />}
        />
        <Route
          path={AppRoutes.ErrorInvalidAddress}
          element={<ErrorView type={ErrorType.InvalidAddress} />}
        />
        <Route path="*" element={<Navigate to={AppRoutes.NotFound} />} />
      </Routes>

      {wallet.status === ConnectionStatus.Connecting && (
        <WalletConnectingScreen />
      )}
    </BrowserRouter>
  );
};

export default AppRouter;
