const {expect} = require("chai");
const {ethers} = require("hardhat");

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether");
}

const ether = tokens;

describe("FlashLoan", () => {
    let flashLoan, token, flashLoanReceiver,deployer

    beforeEach(async () => {

        //Setup accounts
        accounts = await ethers.getSigners()
        deployer = accounts[0]

        //Loading Contracts ...
        const Token = await ethers.getContractFactory("Token")
        const FlashLoan = await ethers.getContractFactory("FlashLoan")
        const FlashLoanReceiver = await ethers.getContractFactory("FlashLoanReceiver")

        //Deploying Contracts ... 
        token = await Token.deploy("Hadi Ettefagh", "HA", tokens(1000000))
        flashLoan = await FlashLoan.deploy(token.address)
        flashLoanReceiver = await FlashLoanReceiver.deploy(flashLoan.address)

        //approve flash loon contracts
        let transaction = await token.connect(deployer).approve(flashLoan.address, tokens(1000000))
        await transaction.wait()

        //Deposit tokens to the flash loon
        transaction = await flashLoan.connect(deployer).depositTokens(tokens(1000000))
        await transaction.wait()
    })

    describe("Deployment", () => {
        it("Send tokens to flash loom", async () => {
            expect( await token.balanceOf(flashLoan.address)).to.equal(tokens(1000000))
        })
    })

    describe("Borrowing funds", () => {
        it("brows funds from the pool", async () => {
            let amount = tokens(100)
            transaction = await flashLoanReceiver.connect(deployer).executeFlashLoan(amount)
            let result = await transaction.wait( )

            await expect(transaction).to.emit(flashLoanReceiver, "LoamReceived").withArgs(token.address, amount)
        })
    })
})