const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});

router.get('/agents', (req, res) => {
  res.render('agents', { user: req.session.user });
});

router.get('/advisors', (req, res) => {
  res.render('advisors', { user: req.session.user });
});

router.get('/content', (req, res) => {
  res.render('content', { user: req.session.user });
});

// Analytics routes - Story 4.4
router.get('/analytics', (req, res) => {
  res.render('analytics/executive', { user: req.session.user });
});

router.get('/analytics/executive', (req, res) => {
  res.render('analytics/executive', { user: req.session.user });
});

router.get('/analytics/kpis', (req, res) => {
  res.render('analytics/kpis', { user: req.session.user });
});

router.get('/analytics/content', (req, res) => {
  res.render('analytics/kpis', { user: req.session.user });
});

router.get('/analytics/advisors', (req, res) => {
  res.render('analytics/kpis', { user: req.session.user });
});

router.get('/analytics/reports', (req, res) => {
  res.render('analytics/reports', { user: req.session.user });
});

router.get('/logs', (req, res) => {
  res.render('logs', { user: req.session.user });
});

router.get('/backup', (req, res) => {
  res.render('backup', { user: req.session.user });
});

// WhatsApp route is handled by the WhatsApp interface module
// router.get('/whatsapp', (req, res) => {
//   res.render('whatsapp', { user: req.session.user });
// });

module.exports = router;