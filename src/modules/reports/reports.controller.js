const reportsRepository = require('./reports.repository');
const { sendErrorResponse, sendSuccessResponse } = require('../../utils/responseHandler');

const reportsController = {
  // Get sales report
  getSalesReport: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const report = await reportsRepository.getSalesReport(startDate, endDate);
      return sendSuccessResponse(res, report, 'Sales report fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Get user report
  getUserReport: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const report = await reportsRepository.getUserReport(startDate, endDate);
      return sendSuccessResponse(res, report, 'User report fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Get product report
  getProductReport: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const report = await reportsRepository.getProductReport(startDate, endDate);
      return sendSuccessResponse(res, report, 'Product report fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Get inventory report
  getInventoryReport: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const report = await reportsRepository.getInventoryReport(startDate, endDate);
      return sendSuccessResponse(res, report, 'Inventory report fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Get ticket report
  getTicketReport: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const report = await reportsRepository.getTicketReport(startDate, endDate);
      return sendSuccessResponse(res, report, 'Ticket report fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Export report
  exportReport: async (req, res) => {
    try {
      const { type, format, startDate, endDate } = req.query;
      
      let report;
      switch (type) {
        case 'sales':
          report = await reportsRepository.getSalesReport(startDate, endDate);
          break;
        case 'users':
          report = await reportsRepository.getUserReport(startDate, endDate);
          break;
        case 'products':
          report = await reportsRepository.getProductReport(startDate, endDate);
          break;
        case 'inventory':
          report = await reportsRepository.getInventoryReport(startDate, endDate);
          break;
        case 'tickets':
          report = await reportsRepository.getTicketReport(startDate, endDate);
          break;
        default:
          return sendErrorResponse(res, 'Invalid report type', 400);
      }

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type}_report.csv`);
        res.send(reportsRepository.convertToCSV(report, type));
      } else if (format === 'pdf') {
        // For PDF, you would need a PDF generation library like pdfkit or puppeteer
        // For now, return JSON
        return sendSuccessResponse(res, report, 'PDF export not implemented yet');
      } else {
        return sendErrorResponse(res, 'Invalid format', 400);
      }
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },
};

module.exports = reportsController;
