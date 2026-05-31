const { HTTP_STATUS } = require("../../constants");
const walletService = require("./service");
const {
  validateWalletTransactionsQuery,
  validateTopupPayload,
  validatePayoutProfilePayload,
  validateWithdrawRequestPayload,
  validateWithdrawRequestsQuery,
  validateWithdrawReviewPayload,
  validateWalletTopupWebhookPayload,
  validateAdminTransactionsQuery,
} = require("../../validations/wallet.validation");
const { validateObjectIdParam } = require("../../validations/venue.validation");

class WalletController {
  normalizeApiKey(value) {
    if (!value) {
      return "";
    }

    return String(value).replace(/^(Bearer|Apikey)\s+/i, "").trim();
  }

  async getMyWallet(req, res) {
    try {
      const data = await walletService.getMyWallet(req.user.id);
      return res.status(HTTP_STATUS.OK).json({
        message: "Wallet fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async listMyTransactions(req, res) {
    const { isValid, errors, value } = validateWalletTransactionsQuery(req.query);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await walletService.listMyTransactions(req.user.id, value);
      return res.status(HTTP_STATUS.OK).json({
        message: "Wallet transactions fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async createTopupIntent(req, res) {
    const { isValid, errors, value } = validateTopupPayload(req.body);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await walletService.createTopupIntent(req.user.id, value);
      return res.status(HTTP_STATUS.CREATED).json({
        message: "Wallet topup intent created successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async createPayoutProfile(req, res) {
    const { isValid, errors, value } = validatePayoutProfilePayload(req.body);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await walletService.createPayoutProfile(req.user.id, value);
      return res.status(HTTP_STATUS.CREATED).json({
        message: "Payout profile created successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async updatePayoutProfile(req, res) {
    const idValidation = validateObjectIdParam(req.params.profileId, "Payout profile");
    const payloadValidation = validatePayoutProfilePayload(req.body);

    if (!idValidation.isValid || !payloadValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        errors: [...idValidation.errors, ...payloadValidation.errors],
      });
    }

    try {
      const data = await walletService.updatePayoutProfile(
        req.user.id,
        req.params.profileId,
        payloadValidation.value
      );

      return res.status(HTTP_STATUS.OK).json({
        message: "Payout profile updated successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async deletePayoutProfile(req, res) {
    const idValidation = validateObjectIdParam(req.params.profileId, "Payout profile");

    if (!idValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors: idValidation.errors });
    }

    try {
      const data = await walletService.deletePayoutProfile(req.user.id, req.params.profileId);
      return res.status(HTTP_STATUS.OK).json({
        message: "Payout profile deleted successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async createWithdrawRequest(req, res) {
    const { isValid, errors, value } = validateWithdrawRequestPayload(req.body);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await walletService.createWithdrawRequest(req.user.id, value);
      return res.status(HTTP_STATUS.CREATED).json({
        message: "Withdraw request created successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async listMyWithdrawRequests(req, res) {
    const { isValid, errors, value } = validateWithdrawRequestsQuery(req.query);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await walletService.listMyWithdrawRequests(req.user.id, value);
      return res.status(HTTP_STATUS.OK).json({
        message: "Withdraw requests fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async listAdminWithdrawRequests(req, res) {
    const { isValid, errors, value } = validateWithdrawRequestsQuery(req.query);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await walletService.listAdminWithdrawRequests(value);
      return res.status(HTTP_STATUS.OK).json({
        message: "Admin withdraw requests fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async listAdminTransactions(req, res) {
    const { isValid, errors, value } = validateAdminTransactionsQuery(req.query);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await walletService.listAdminTransactions(value);
      return res.status(HTTP_STATUS.OK).json({
        message: "Admin wallet transactions fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async getAdminSettlementDashboard(req, res) {
    try {
      const data = await walletService.getAdminSettlementDashboard();
      return res.status(HTTP_STATUS.OK).json({
        message: "Admin settlement dashboard fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async listAdminOwnerSettlements(req, res) {
    const { isValid, errors, value } = validateWithdrawRequestsQuery(req.query);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await walletService.listAdminOwnerSettlements(value);
      return res.status(HTTP_STATUS.OK).json({
        message: "Admin owner settlements fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async reviewWithdrawRequest(req, res) {
    const idValidation = validateObjectIdParam(req.params.withdrawRequestId, "Withdraw request");
    const payloadValidation = validateWithdrawReviewPayload(req.body);

    if (!idValidation.isValid || !payloadValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        errors: [...idValidation.errors, ...payloadValidation.errors],
      });
    }

    try {
      const data = await walletService.reviewWithdrawRequest(
        req.user.id,
        req.params.withdrawRequestId,
        payloadValidation.value
      );

      return res.status(HTTP_STATUS.OK).json({
        message: "Withdraw request processed successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async handleTopupWebhook(req, res) {
    const expectedApiKey = this.normalizeApiKey(process.env.SEPAY_API_KEY);
    const providedApiKey = this.normalizeApiKey(req.headers.authorization);

    if (req.params.provider !== "sepay") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Unsupported wallet topup provider.",
      });
    }

    if (!expectedApiKey) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: "SEPAY_API_KEY is not configured.",
      });
    }

    if (!providedApiKey || providedApiKey !== expectedApiKey) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: "Invalid Sepay webhook authorization.",
      });
    }

    const payloadValidation = validateWalletTopupWebhookPayload(req.body);

    if (!payloadValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors: payloadValidation.errors });
    }

    try {
      const data = await walletService.handleTopupWebhook(
        req.params.provider,
        payloadValidation.value
      );

      return res.status(HTTP_STATUS.OK).json({
        message: "Wallet topup webhook processed successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }
}

module.exports = new WalletController();
