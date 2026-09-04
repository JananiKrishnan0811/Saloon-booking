const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const {
  getAvailabilityByStaff,
  createAvailability
} = require('../controllers/availabilityConroller');

router.get('/', getAvailabilityByStaff);
router.post('/', protect, authorize('salon_owner', 'admin'), createAvailability);

module.exports = router;
