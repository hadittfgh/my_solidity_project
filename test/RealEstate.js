const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether");
}

const ether = tokens;

describe("RealEstate", () => {
    let realEstate, escrow
    let deploy, seller, buyer, inspector, lender, purchasePrice, escrowAmount
    let nftID = 1

    beforeEach(async () => {

        //SetUp accounts
        accounts = await ethers.getSigners()
        deploy = accounts[0]
        purchasePrice = ether(100)
        escrowAmount = ether(20)
        seller = deploy
        buyer = accounts[1]
        inspector = accounts[2]
        lender = accounts[3]

        //Loading Contracts ...
        const RealEstate = await ethers.getContractFactory("RealEstate")
        const Escrow = await ethers.getContractFactory("Escrow")

        //Deploying Contracts ...
        realEstate = await RealEstate.deploy()
        escrow = await Escrow.deploy(
            realEstate.address,
            nftID,
            purchasePrice,
            escrowAmount,
            seller.address,
            buyer.address,
            inspector.address,
            lender.address
            )
        transaction = await realEstate.connect(seller).approve(escrow.address, nftID)
    })

    describe("Deployment", async () => {
        it("sends on NFT to the seller/deployer", async () => {
            expect(await realEstate.ownerOf(nftID)).to.equal(seller.address)
        })
    })

    describe("Selling real estate", async () => {

        let transaction, balance

        it("Execute a successful transaction", async () => {
            //Expect seller owner of the NFT before sell
            expect(await realEstate.ownerOf(nftID)).to.equal(seller.address)

            //Check escrow balance
            balance = await escrow.getBalance()
            console.log("escrow balance: ", ethers.utils.formatEther(balance))

            //Buyer deposit earnest
            transaction = await escrow.connect(buyer).depositEarnest({ value : escrowAmount })
            await transaction.wait()
            console.log("Buyer deposit earnest mony")

            //Update inspection status
            transaction = await escrow.connect(inspector).updateInspectorStatus(true)
            await transaction.wait()
            console.log("update inspector status")

            //Buyer approve
            transaction = await escrow.connect(buyer).approveSale()
            await transaction.wait()
            console.log("Buyer approve sale");

            //seller approve
            transaction = await escrow.connect(seller).approveSale()
            await transaction.wait()
            console.log("seller approve sale");

            //lender funds sale
            transaction = await lender.sendTransaction({ to:escrow.address, value:ether(80) })

            //lender approve
            transaction = await escrow.connect(lender).approveSale()
            await transaction.wait()
            console.log("lender approve sale");

            //Check escrow balance
            balance = await escrow.getBalance()
            console.log("escrow balance: ", ethers.utils.formatEther(balance))

            //Finalize Sale
            transaction = await escrow.connect(buyer).finalizeSale()
            await transaction.wait()
            console.log("Buyer finalize sale")

            //seller balance
            balance = await ethers.provider.getBalance(seller.address)
            console.log("Seller balance: ", ethers.utils.formatEther(balance))
            expect(balance).to.be.above(ether(10099))


            //Expect buyer owner of the NFT after sell
            expect(await realEstate.ownerOf(nftID)).to.equal(buyer.address)

        })
    })
})