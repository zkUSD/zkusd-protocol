const StabilityPool = artifacts.require("./StabilityPool.sol");
const ActivePool = artifacts.require("./ActivePool.sol");
const DefaultPool = artifacts.require("./DefaultPool.sol");
const NonPayable = artifacts.require("./NonPayable.sol");

const testHelpers = require("../utils/testHelpers.js");

const th = testHelpers.TestHelper;
const dec = th.dec;

const _minus_1_Ether = web3.utils.toWei("-1", "ether");

contract("StabilityPool", async (accounts) => {
  /* mock* are EOA’s, temporarily used to call protected functions.
    TODO: Replace with mock contracts, and later complete transactions from EOA
    */
  let stabilityPool;

  const [owner, alice, treasury] = accounts;

  beforeEach(async () => {
    stabilityPool = await StabilityPool.new();
    const mockActivePoolAddress = (await NonPayable.new()).address;
    const dumbContractAddress = (await NonPayable.new()).address;
    await stabilityPool.setAddresses(
      dumbContractAddress,
      dumbContractAddress,
      mockActivePoolAddress,
      dumbContractAddress,
      dumbContractAddress,
      dumbContractAddress,
      dumbContractAddress,
      treasury
    );
  });

  it("getETH(): gets the recorded ETH balance", async () => {
    const recordedETHBalance = await stabilityPool.getETH();
    assert.equal(recordedETHBalance, 0);
  });

  it("getTotalZKUSDDeposits(): gets the recorded ZKUSD balance", async () => {
    const recordedETHBalance = await stabilityPool.getTotalZKUSDDeposits();
    assert.equal(recordedETHBalance, 0);
  });
});

contract("ActivePool", async (accounts) => {
  let activePool, mockBorrowerOperations;

  const [owner, alice] = accounts;
  beforeEach(async () => {
    activePool = await ActivePool.new();
    mockBorrowerOperations = await NonPayable.new();
    const dumbContractAddress = (await NonPayable.new()).address;
    await activePool.setAddresses(
      mockBorrowerOperations.address,
      dumbContractAddress,
      dumbContractAddress,
      dumbContractAddress
    );
  });

  it("getETH(): gets the recorded ETH balance", async () => {
    const recordedETHBalance = await activePool.getETH();
    assert.equal(recordedETHBalance, 0);
  });

  it("getZKUSDDebt(): gets the recorded ZKUSD balance", async () => {
    const recordedETHBalance = await activePool.getZKUSDDebt();
    assert.equal(recordedETHBalance, 0);
  });

  it("increaseZKUSD(): increases the recorded ZKUSD balance by the correct amount", async () => {
    const recordedZKUSD_balanceBefore = await activePool.getZKUSDDebt();
    assert.equal(recordedZKUSD_balanceBefore, 0);

    // await activePool.increaseZKUSDDebt(100, { from: mockBorrowerOperationsAddress })
    const increaseZKUSDDebtData = th.getTransactionData(
      "increaseZKUSDDebt(uint256)",
      ["0x64"]
    );
    const tx = await mockBorrowerOperations.forward(
      activePool.address,
      increaseZKUSDDebtData
    );
    assert.isTrue(tx.receipt.status);
    const recordedZKUSD_balanceAfter = await activePool.getZKUSDDebt();
    assert.equal(recordedZKUSD_balanceAfter, 100);
  });
  // Decrease
  it("decreaseZKUSD(): decreases the recorded ZKUSD balance by the correct amount", async () => {
    // start the pool on 100 wei
    //await activePool.increaseZKUSDDebt(100, { from: mockBorrowerOperationsAddress })
    const increaseZKUSDDebtData = th.getTransactionData(
      "increaseZKUSDDebt(uint256)",
      ["0x64"]
    );
    const tx1 = await mockBorrowerOperations.forward(
      activePool.address,
      increaseZKUSDDebtData
    );
    assert.isTrue(tx1.receipt.status);

    const recordedZKUSD_balanceBefore = await activePool.getZKUSDDebt();
    assert.equal(recordedZKUSD_balanceBefore, 100);

    //await activePool.decreaseZKUSDDebt(100, { from: mockBorrowerOperationsAddress })
    const decreaseZKUSDDebtData = th.getTransactionData(
      "decreaseZKUSDDebt(uint256)",
      ["0x64"]
    );
    const tx2 = await mockBorrowerOperations.forward(
      activePool.address,
      decreaseZKUSDDebtData
    );
    assert.isTrue(tx2.receipt.status);
    const recordedZKUSD_balanceAfter = await activePool.getZKUSDDebt();
    assert.equal(recordedZKUSD_balanceAfter, 0);
  });

  // send raw ether
  it("sendETH(): decreases the recorded ETH balance by the correct amount", async () => {
    // setup: give pool 2 ether
    const activePool_initialBalance = web3.utils.toBN(
      await web3.eth.getBalance(activePool.address)
    );
    assert.equal(activePool_initialBalance, 0);
    // start pool with 2 ether
    //await web3.eth.sendTransaction({ from: mockBorrowerOperationsAddress, to: activePool.address, value: dec(2, 'ether') })
    const tx1 = await mockBorrowerOperations.forward(activePool.address, "0x", {
      from: owner,
      value: dec(2, "ether"),
    });
    assert.isTrue(tx1.receipt.status);

    const activePool_BalanceBeforeTx = web3.utils.toBN(
      await web3.eth.getBalance(activePool.address)
    );
    const alice_Balance_BeforeTx = web3.utils.toBN(
      await web3.eth.getBalance(alice)
    );

    assert.equal(activePool_BalanceBeforeTx, dec(2, "ether"));

    // send ether from pool to alice
    //await activePool.sendETH(alice, dec(1, 'ether'), { from: mockBorrowerOperationsAddress })
    const sendETHData = th.getTransactionData("sendETH(address,uint256)", [
      alice,
      web3.utils.toHex(dec(1, "ether")),
    ]);
    const tx2 = await mockBorrowerOperations.forward(
      activePool.address,
      sendETHData,
      { from: owner }
    );
    assert.isTrue(tx2.receipt.status);

    const activePool_BalanceAfterTx = web3.utils.toBN(
      await web3.eth.getBalance(activePool.address)
    );
    const alice_Balance_AfterTx = web3.utils.toBN(
      await web3.eth.getBalance(alice)
    );

    const alice_BalanceChange = alice_Balance_AfterTx.sub(
      alice_Balance_BeforeTx
    );
    const pool_BalanceChange = activePool_BalanceAfterTx.sub(
      activePool_BalanceBeforeTx
    );
    assert.equal(alice_BalanceChange, dec(1, "ether"));
    assert.equal(pool_BalanceChange, _minus_1_Ether);
  });
});

contract("DefaultPool", async (accounts) => {
  let defaultPool, mockTroveManager, mockActivePool;

  const [owner, alice] = accounts;
  beforeEach(async () => {
    defaultPool = await DefaultPool.new();
    mockTroveManager = await NonPayable.new();
    mockActivePool = await NonPayable.new();
    await defaultPool.setAddresses(
      mockTroveManager.address,
      mockActivePool.address
    );
  });

  it("getETH(): gets the recorded ZKUSD balance", async () => {
    const recordedETHBalance = await defaultPool.getETH();
    assert.equal(recordedETHBalance, 0);
  });

  it("getZKUSDDebt(): gets the recorded ZKUSD balance", async () => {
    const recordedETHBalance = await defaultPool.getZKUSDDebt();
    assert.equal(recordedETHBalance, 0);
  });

  it("increaseZKUSD(): increases the recorded ZKUSD balance by the correct amount", async () => {
    const recordedZKUSD_balanceBefore = await defaultPool.getZKUSDDebt();
    assert.equal(recordedZKUSD_balanceBefore, 0);

    // await defaultPool.increaseZKUSDDebt(100, { from: mockTroveManagerAddress })
    const increaseZKUSDDebtData = th.getTransactionData(
      "increaseZKUSDDebt(uint256)",
      ["0x64"]
    );
    const tx = await mockTroveManager.forward(
      defaultPool.address,
      increaseZKUSDDebtData
    );
    assert.isTrue(tx.receipt.status);

    const recordedZKUSD_balanceAfter = await defaultPool.getZKUSDDebt();
    assert.equal(recordedZKUSD_balanceAfter, 100);
  });

  it("decreaseZKUSD(): decreases the recorded ZKUSD balance by the correct amount", async () => {
    // start the pool on 100 wei
    //await defaultPool.increaseZKUSDDebt(100, { from: mockTroveManagerAddress })
    const increaseZKUSDDebtData = th.getTransactionData(
      "increaseZKUSDDebt(uint256)",
      ["0x64"]
    );
    const tx1 = await mockTroveManager.forward(
      defaultPool.address,
      increaseZKUSDDebtData
    );
    assert.isTrue(tx1.receipt.status);

    const recordedZKUSD_balanceBefore = await defaultPool.getZKUSDDebt();
    assert.equal(recordedZKUSD_balanceBefore, 100);

    // await defaultPool.decreaseZKUSDDebt(100, { from: mockTroveManagerAddress })
    const decreaseZKUSDDebtData = th.getTransactionData(
      "decreaseZKUSDDebt(uint256)",
      ["0x64"]
    );
    const tx2 = await mockTroveManager.forward(
      defaultPool.address,
      decreaseZKUSDDebtData
    );
    assert.isTrue(tx2.receipt.status);

    const recordedZKUSD_balanceAfter = await defaultPool.getZKUSDDebt();
    assert.equal(recordedZKUSD_balanceAfter, 0);
  });

  // send raw ether
  it("sendETHToActivePool(): decreases the recorded ETH balance by the correct amount", async () => {
    // setup: give pool 2 ether
    const defaultPool_initialBalance = web3.utils.toBN(
      await web3.eth.getBalance(defaultPool.address)
    );
    assert.equal(defaultPool_initialBalance, 0);

    // start pool with 2 ether
    //await web3.eth.sendTransaction({ from: mockActivePool.address, to: defaultPool.address, value: dec(2, 'ether') })
    const tx1 = await mockActivePool.forward(defaultPool.address, "0x", {
      from: owner,
      value: dec(2, "ether"),
    });
    assert.isTrue(tx1.receipt.status);

    const defaultPool_BalanceBeforeTx = web3.utils.toBN(
      await web3.eth.getBalance(defaultPool.address)
    );
    const activePool_Balance_BeforeTx = web3.utils.toBN(
      await web3.eth.getBalance(mockActivePool.address)
    );

    assert.equal(defaultPool_BalanceBeforeTx, dec(2, "ether"));

    // send ether from pool to alice
    //await defaultPool.sendETHToActivePool(dec(1, 'ether'), { from: mockTroveManagerAddress })
    const sendETHData = th.getTransactionData("sendETHToActivePool(uint256)", [
      web3.utils.toHex(dec(1, "ether")),
    ]);
    await mockActivePool.setPayable(true);
    const tx2 = await mockTroveManager.forward(
      defaultPool.address,
      sendETHData,
      { from: owner }
    );
    assert.isTrue(tx2.receipt.status);

    const defaultPool_BalanceAfterTx = web3.utils.toBN(
      await web3.eth.getBalance(defaultPool.address)
    );
    const activePool_Balance_AfterTx = web3.utils.toBN(
      await web3.eth.getBalance(mockActivePool.address)
    );

    const activePool_BalanceChange = activePool_Balance_AfterTx.sub(
      activePool_Balance_BeforeTx
    );
    const defaultPool_BalanceChange = defaultPool_BalanceAfterTx.sub(
      defaultPool_BalanceBeforeTx
    );
    assert.equal(activePool_BalanceChange, dec(1, "ether"));
    assert.equal(defaultPool_BalanceChange, _minus_1_Ether);
  });
});

contract("Reset chain state", async (accounts) => {});
