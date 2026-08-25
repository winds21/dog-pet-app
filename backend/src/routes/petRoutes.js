// 狗狗互动相关路由
import { Router } from 'express';
import { getStats, feedPet, petPet, walkPet, renamePet, cleanPet } from '../controllers/petController.js';

const router = Router();

// 获取狗狗当前状态
router.get('/stats', getStats);

// 喂食
router.post('/feed', feedPet);

// 抚摸
router.post('/pet', petPet);

// 遛狗（随机彩蛋）
router.post('/walk', walkPet);

// 洗澡
router.post('/clean', cleanPet);

// 给狗狗起名字
router.post('/rename', renamePet);

export default router;
