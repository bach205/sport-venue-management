const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/requireRole.middleware");
const walletController = require("./controller");

const router = express.Router();

router.get(
  "/wallet/me",
  authMiddleware,
  asyncHandler((req, res) => walletController.getMyWallet(req, res))
);
router.get(
  "/wallet/me/transactions",
  authMiddleware,
  asyncHandler((req, res) => walletController.listMyTransactions(req, res))
);
router.post(
  "/wallet/topups",
  authMiddleware,
  asyncHandler((req, res) => walletController.createTopupIntent(req, res))
);
router.post(
  "/wallet/payout-profiles",
  authMiddleware,
  asyncHandler((req, res) => walletController.createPayoutProfile(req, res))
);
router.patch(
  "/wallet/payout-profiles/:profileId",
  authMiddleware,
  asyncHandler((req, res) => walletController.updatePayoutProfile(req, res))
);
router.delete(
  "/wallet/payout-profiles/:profileId",
  authMiddleware,
  asyncHandler((req, res) => walletController.deletePayoutProfile(req, res))
);
router.post(
  "/wallet/withdraw-requests",
  authMiddleware,
  asyncHandler((req, res) => walletController.createWithdrawRequest(req, res))
);
router.get(
  "/wallet/withdraw-requests",
  authMiddleware,
  asyncHandler((req, res) => walletController.listMyWithdrawRequests(req, res))
);

router.get(
  "/admin/wallet/withdraw-requests",
  authMiddleware,
  requireRole("admin"),
  asyncHandler((req, res) => walletController.listAdminWithdrawRequests(req, res))
);
router.get(
  "/admin/wallet/transactions",
  authMiddleware,
  requireRole("admin"),
  asyncHandler((req, res) => walletController.listAdminTransactions(req, res))
);
router.get(
  "/admin/wallet/settlement-dashboard",
  authMiddleware,
  requireRole("admin"),
  asyncHandler((req, res) => walletController.getAdminSettlementDashboard(req, res))
);
router.get(
  "/admin/wallet/owner-settlements",
  authMiddleware,
  requireRole("admin"),
  asyncHandler((req, res) => walletController.listAdminOwnerSettlements(req, res))
);
router.patch(
  "/admin/wallet/withdraw-requests/:withdrawRequestId",
  authMiddleware,
  requireRole("admin"),
  asyncHandler((req, res) => walletController.reviewWithdrawRequest(req, res))
);

router.post(
  "/webhooks/wallet-topups/:provider",
  asyncHandler((req, res) => walletController.handleTopupWebhook(req, res))
);

module.exports = router;
