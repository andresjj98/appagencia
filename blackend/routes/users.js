const express = require('express');
const multer = require('multer');
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  uploadAvatar,
  deleteAvatar,
} = require('../controllers/users.controller');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.put('/:id/avatar', upload.single('avatar'), uploadAvatar);
router.delete('/:id/avatar', deleteAvatar);

module.exports = router;
