const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { askAssistant } = require('../controllers/assistantController');

const router = express.Router();

router.post('/', protect, authorize('customer', 'worker'), askAssistant);

module.exports = router;
