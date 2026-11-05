const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { createTicket, getMyTickets } = require('../controllers/ticketController');

const router = express.Router();

router.use(protect, authorize('customer', 'worker'));

router.post('/', createTicket);
router.get('/mine', getMyTickets);

module.exports = router;
