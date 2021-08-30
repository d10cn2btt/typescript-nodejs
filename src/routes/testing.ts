import express, { Router } from 'express';
const router = Router();

// Error handling
router.get('/error/:statusCode', (req, res) => {
  const statusCode = Number(req.params.statusCode);
  res.type('text/plain');
  res.status(statusCode);
  return res.send(statusCode);
});

export default router;
