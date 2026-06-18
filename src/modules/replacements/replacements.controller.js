const replacementsRepository = require('./replacements.repository');
const { sendErrorResponse, sendSuccessResponse } = require('../../utils/responseHandler');
const { emitToAdmins, emitToUser } = require('../../shared/events/eventBus');
const { socketEvents } = require('../../shared/events/socketEvents');

const replacementsController = {
  // Create replacement request
  createReplacementRequest: async (req, res) => {
    try {
      const { orderId, replacementItems, reason, comments, pickupAddress, images } = req.body;
      const userId = req.user.id;

      if (!orderId || !replacementItems || !reason || !pickupAddress) {
        return sendErrorResponse(res, 'All required fields must be provided', 400);
      }

      const replacementPayload = {
        user: userId,
        order: orderId,
        replacementItems,
        reason,
        comments,
        pickupAddress,
        images: images || [],
        status: 'initiated',
      };

      const replacementRequest = await replacementsRepository.createReplacementRequest(replacementPayload);

      // Emit socket event for admin notification
      emitToAdmins(req.app, socketEvents.DOMAIN.REPLACEMENT_CREATED, {
        replacementId: replacementRequest._id,
        orderId: replacementRequest.order,
        reason: replacementRequest.reason,
        status: replacementRequest.status,
      });

      return sendSuccessResponse(res, { replacementRequest }, 'Replacement request created successfully', 201);
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Get user's replacements
  getUserReplacements: async (req, res) => {
    try {
      const userId = req.user.id;
      const replacements = await replacementsRepository.getReplacementRequests({ user: userId });
      return sendSuccessResponse(res, { replacements }, 'Replacement requests fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Get single replacement detail
  getReplacementDetail: async (req, res) => {
    try {
      const { replacementId } = req.params;
      const userId = req.user.id;

      const replacementRequest = await replacementsRepository.getReplacementRequestById(replacementId);

      if (!replacementRequest) {
        return sendErrorResponse(res, 'Replacement request not found', 404);
      }

      // Verify replacement belongs to user
      if (replacementRequest.user.toString() !== userId) {
        return sendErrorResponse(res, 'Unauthorized', 403);
      }

      return sendSuccessResponse(res, { replacementRequest }, 'Replacement request fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Get all replacements (admin)
  getAllReplacements: async (req, res) => {
    try {
      const { status } = req.query;
      const filter = status ? { status } : {};
      const replacements = await replacementsRepository.getReplacementRequests(filter);
      return sendSuccessResponse(res, { replacements }, 'All replacement requests fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Update replacement status (admin)
  updateReplacementStatus: async (req, res) => {
    try {
      const { replacementId } = req.params;
      const { status, adminNotes, rejectionReason, trackingNumber } = req.body;

      if (!status) {
        return sendErrorResponse(res, 'Status is required', 400);
      }

      const updatedReplacement = await replacementsRepository.updateReplacementStatus(
        replacementId,
        status,
        adminNotes,
        rejectionReason,
        trackingNumber
      );

      // Emit socket event for user notification
      emitToUser(req.app, updatedReplacement.user, socketEvents.DOMAIN.REPLACEMENT_UPDATED, {
        replacementId: updatedReplacement._id,
        status: updatedReplacement.status,
        trackingNumber: updatedReplacement.trackingNumber,
        adminNotes: updatedReplacement.adminNotes,
      });

      return sendSuccessResponse(res, { replacementRequest: updatedReplacement }, 'Replacement status updated successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },
};

module.exports = replacementsController;
