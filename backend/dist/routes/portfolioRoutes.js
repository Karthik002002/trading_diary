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
const portfolio_1 = __importDefault(require("../models/portfolio"));
const validateRequest_1 = require("../middleware/validateRequest");
const portfolioValidators_1 = require("../validators/portfolioValidators");
const router = express_1.default.Router();
// Create new portfolio
router.post('/', portfolioValidators_1.createPortfolioValidator, validateRequest_1.validateRequest, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const portfolio = new portfolio_1.default(req.body);
        const savedPortfolio = yield portfolio.save();
        res.status(201).json(savedPortfolio);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
// Get all portfolios
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const portfolios = yield portfolio_1.default.find();
        res.json(portfolios);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
// Get single portfolio
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const portfolio = yield portfolio_1.default.findOne({ id: parseInt(req.params.id) });
        if (!portfolio)
            return res.status(404).json({ message: 'Portfolio not found' });
        res.json(portfolio);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
// Update portfolio
router.put('/:id', portfolioValidators_1.updatePortfolioValidator, validateRequest_1.validateRequest, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const portfolio = yield portfolio_1.default.findOne({ id: parseInt(req.params.id) });
        if (!portfolio)
            return res.status(404).json({ message: 'Portfolio not found' });
        Object.assign(portfolio, req.body);
        const updatedPortfolio = yield portfolio.save();
        res.json(updatedPortfolio);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
// Delete portfolio
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const portfolio = yield portfolio_1.default.findOneAndDelete({ id: parseInt(req.params.id) });
        if (!portfolio)
            return res.status(404).json({ message: 'Portfolio not found' });
        res.json({ message: 'Portfolio deleted' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
exports.default = router;
