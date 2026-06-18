const returnsRepository = require('./returns.repository');
const { sendErrorResponse, sendSuccessResponse } = require('../../utils/responseHandler');
const { emitToAdmins, emitToUser } = require('../../shared/events/eventBus');
const { socketEvents } = require('../../shared/events/socketEvents');

const returnsController = {
  // Create return request
  createReturnRequest: async (req, res) => {
    try {
      const { orderId, returnItems, reason, comments, pickupAddress, images } = req.body;
      const userId = req.user.id;

      if (!orderId || !returnItems || !reason || !pickupAddress) {
        return sendErrorResponse(res, 'All required fields must be provided', 400);
      }

      const returnPayload = {
        user: userId,
        order: orderId,
        returnItems,
        reason,
        comments,
        pickupAddress,
        images: images || [],
        status: 'initiated',
      };

      const returnRequest = await returnsRepository.createReturnRequest(returnPayload);

      // Emit socket event for admin notification
      emitToAdmins(req.app, socketEvents.DOMAIN.RETURN_CREATED, {
        returnId: returnRequest._id,
        orderId: returnRequest.order,
        reason: returnRequest.reason,
        status: returnRequest.status,
      });

      return sendSuccessResponse(res, { returnRequest }, 'Return request created successfully', 201);
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Get user's returns
  getUserReturns: async (req, res) => {
    try {
      const userId = req.user.id;
      const returns = await returnsRepository.getReturnRequests({ user: userId });
      return sendSuccessResponse(res, { returns }, 'Return requests fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Get single return detail
  getReturnDetail: async (req, res) => {
    try {
      const { returnId } = req.params;
      const userId = req.user.id;

      const returnRequest = await returnsRepository.getReturnRequestById(returnId);

      if (!returnRequest) {
        return sendErrorResponse(res, 'Return request not found', 404);
      }

      // Verify return belongs to user
      if (returnRequest.user.toString() !== userId) {
        return sendErrorResponse(res, 'Unauthorized', 403);
      }

      return sendSuccessResponse(res, { returnRequest }, 'Return request fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Get all returns (admin)
  getAllReturns: async (req, res) => {
    try {
      const { status } = req.query;
      const filter = status ? { status } : {};
      const returns = await returnsRepository.getReturnRequests(filter);
      return sendSuccessResponse(res, { returns }, 'All return requests fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Update return status (admin)
  updateReturnStatus: async (req, res) => {
    try {
      const { returnId } = req.params;
      const { status, adminNotes, rejectionReason } = req.body;

      if (!status) {
        return sendErrorResponse(res, 'Status is required', 400);
      }

      const updatedReturn = await returnsRepository.updateReturnStatus(returnId, status, adminNotes, rejectionReason);

      // Emit socket event for user notification
      emitToUser(req.app, updatedReturn.user, socketEvents.DOMAIN.RETURN_UPDATED, {
        returnId: updatedReturn._id,
        status: updatedReturn.status,
        adminNotes: updatedReturn.adminNotes,
      });

      return sendSuccessResponse(res, { returnRequest: updatedReturn }, 'Return status updated successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },
};

module.exports = returnsController;
