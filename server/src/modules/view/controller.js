const { HTTP_STATUS } = require("../../constants");
const viewService = require("./service");
const { validateTrackViewPayload } = require("../../validations/view.validation");

class ViewController {
  async trackView(req, res) {
    const { isValid, errors, value } = validateTrackViewPayload(req.body);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await viewService.trackView(value);

      return res.status(HTTP_STATUS.OK).json({
        message: "View tracked successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async getTotalViews(req, res) {
    try {
      const total = await viewService.getTotalCount();

      return res.status(HTTP_STATUS.OK).json({
        message: "Total views fetched successfully.",
        data: { total },
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }
}

module.exports = new ViewController();
