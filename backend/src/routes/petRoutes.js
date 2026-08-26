// 狗狗互动相关路由
import { Router } from 'express';
import { getStats, feedPet, petPet, walkPet, renamePet, cleanPet, changeSkin } from '../controllers/petController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// 所有宠物操作路由都需要认证
router.get('/stats', authenticate, getStats);
router.post('/feed', authenticate, feedPet);
router.post('/pet', authenticate, petPet);
router.post('/walk', authenticate, walkPet);
router.post('/clean', authenticate, cleanPet);
router.post('/rename', authenticate, renamePet);
router.post('/skin', authenticate, changeSkin);

export default router;
