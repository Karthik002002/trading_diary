"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const strategy_1 = __importDefault(require("../models/strategy"));
const validateRequest_1 = require("../middleware/validateRequest");
const strategyValidators_1 = require("../validators/strategyValidators");
const router = express_1.default.Router();
// Create new strategy
router.post('/', strategyValidators_1.createStrategyValidator, validateRequest_1.validateRequest, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const strategy = new strategy_1.default(req.body);
        const savedStrategy = yield strategy.save();
        res.status(201).json(savedStrategy);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
// Get all strategies
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const strategies = yield strategy_1.default.find();
        res.json(strategies);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
// Get single strategy
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const strategy = yield strategy_1.default.findOne({ id: parseInt(req.params.id) }); // Find by custom 'id'
        if (!strategy)
            return res.status(404).json({ message: 'Strategy not found' });
        res.json(strategy);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
// Update strategy
router.put('/:id', strategyValidators_1.updateStrategyValidator, validateRequest_1.validateRequest, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const strategy = yield strategy_1.default.findOne({ id: parseInt(req.params.id) });
        if (!strategy)
            return res.status(404).json({ message: 'Strategy not found' });
        Object.assign(strategy, req.body);
        const updatedStrategy = yield strategy.save();
        res.json(updatedStrategy);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
// Delete strategy
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const strategy = yield strategy_1.default.findOneAndDelete({ id: parseInt(req.params.id) });
        if (!strategy)
            return res.status(404).json({ message: 'Strategy not found' });
        res.json({ message: 'Strategy deleted' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
exports.default = router;
