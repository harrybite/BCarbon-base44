const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { ethers } = require('ethers');
const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/bcarbon', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Blockchain Setup
const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/');
const governanceAbi = require('./abis/Governance.json');
const registryAbi = require('./abis/CarbonCreditRegistry.json');
const bco2Abi = require('./abis/BCO2.json');
const governanceContract = new ethers.Contract('0x5296Bc359E5030d75F3c46613facfdE26eCBF24A', governanceAbi, provider);
const registryContract = new ethers.Contract('0x2c90169D9A8e8C2999dDBF1Aae14CFFF381A102E', registryAbi, provider);

// MongoDB Schemas
const projectSchema = new mongoose.Schema({
  projectAddress: { type: String, required: true, unique: true },
  metadata: Object,
  approvalStatus: String,
  supply: Number,
  certificateId: String,
  comments: [{ author: String, text: String, timestamp: Date }],
});
const transactionSchema = new mongoose.Schema({
  transactionHash: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
  projectAddress: String,
  userAddress: String,
});
const Project = mongoose.model('Project', projectSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// API Endpoints
// Get Contract Owner
app.get('/api/contract-owner', async (req, res) => {
  try {
    const owner = await governanceContract.owner();
    res.json({ owner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Project Details
app.get('/api/project/:projectAddress', async (req, res) => {
  const { projectAddress } = req.params;
  const { userAddress } = req.query;
  try {
    const projectDetails = await registryContract.getProjectDetails(projectAddress);
    const isApproved = await registryContract.isProjectApproved(projectAddress);
    const creditAmount = await registryContract.creditAmountIssued(projectAddress);
    const comments = await registryContract.getProjectComments(projectAddress);
    const project = await Project.findOne({ projectAddress }) || { comments: [] };
    const isVVB = userAddress ? await governanceContract.checkAuthorizedVVBs(userAddress) : false;
    const isOwner = userAddress ? (await registryContract.getAuthorizedProjectOwners(projectAddress)).includes(userAddress) : false;
    const canViewComments = isVVB || isOwner;
    res.json({
      ...projectDetails,
      isApproved,
      creditAmount,
      comments: canViewComments ? comments : [],
      offChainComments: canViewComments ? project.comments : [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync Projects
app.get('/api/sync-projects', async (req, res) => {
  try {
    const projectAddresses = await registryContract.getApprovedProjects();
    const projects = [];
    for (const addr of projectAddresses) {
      const details = await registryContract.getProjectDetails(addr);
      const isApproved = await registryContract.isProjectApproved(addr);
      const creditAmount = await registryContract.creditAmountIssued(addr);
      await Project.findOneAndUpdate(
        { projectAddress: addr },
        { metadata: details, approvalStatus: isApproved ? 'Approved' : 'Listed', supply: creditAmount },
        { upsert: true }
      );
      projects.push({ projectAddress: addr, metadata: details, isApproved, creditAmount });
    }
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add Transaction
app.post('/api/transaction', async (req, res) => {
  const { transactionHash, projectAddress, userAddress } = req.body;
  try {
    const receipt = await provider.getTransactionReceipt(transactionHash);
    const status = receipt ? (receipt.status === 1 ? 'confirmed' : 'failed') : 'pending';
    await Transaction.findOneAndUpdate(
      { transactionHash },
      { transactionHash, projectAddress, userAddress, status },
      { upsert: true }
    );
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check Transaction Status
app.get('/api/transaction/:transactionHash', async (req, res) => {
  const { transactionHash } = req.params;
  try {
    const receipt = await provider.getTransactionReceipt(transactionHash);
    const status = receipt ? (receipt.status === 1 ? 'confirmed' : 'failed') : 'pending';
    await Transaction.findOneAndUpdate(
      { transactionHash },
      { status },
      { upsert: true }
    );
    res.json({ status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add Comment
app.post('/api/project/:projectAddress/comment', async (req, res) => {
  const { projectAddress } = req.params;
  const { userAddress, comment } = req.body;
  try {
    const isVVB = await governanceContract.checkAuthorizedVVBs(userAddress);
    const isOwner = (await registryContract.getAuthorizedProjectOwners(projectAddress)).includes(userAddress);
    if (!isVVB && !isOwner) {
      return res.status(403).json({ error: 'Unauthorized to comment' });
    }
    const project = await Project.findOneAndUpdate(
      { projectAddress },
      { $push: { comments: { author: userAddress, text: comment, timestamp: new Date() } } },
      { upsert: true, new: true }
    );
    res.json(project.comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => console.log(`Backend running on port ${port}`));