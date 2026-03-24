/**
 * Audit Routes
 *
 * Provides search and export endpoints for the audit log.
 * All routes require admin authentication.
 *
 * @module routes/auditRoutes
 */

import express from 'express';
import adminAuth from '../middleware/adminAuth.js';
import auditService from '../../services/auditService.js';

const router = express.Router();
router.use(adminAuth);

/**
 * @route  GET /api/audit
 * @desc   Search audit logs with optional filters and pagination.
 * @query  category, action, actor, resourceId, from (ISO), to (ISO), page, limit
 */
router.get('/', async (req, res) => {
  try {
    const result = await auditService.search(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route  GET /api/audit/export
 * @desc   Export audit logs as a CSV file (max 10 000 rows).
 * @query  category, action, actor, resourceId, from (ISO), to (ISO)
 */
router.get('/export', async (req, res) => {
  try {
    const csv = await auditService.exportCsv(req.query);
    const filename = `audit-export-${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route  DELETE /api/audit/purge
 * @desc   Delete audit records older than `retentionDays` days.
 * @body   { retentionDays: number }
 */
router.delete('/purge', async (req, res) => {
  const retentionDays = parseInt(req.body?.retentionDays);
  if (!retentionDays || retentionDays < 1) {
    return res.status(400).json({ error: 'retentionDays must be a positive integer.' });
  }
  try {
    const deleted = await auditService.purgeOldRecords(retentionDays);
    res.json({ deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
