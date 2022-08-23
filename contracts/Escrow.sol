// SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.0;

interface ERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external payable;
}

contract Escrow {
    address public nftAddress;
    uint256 public nftID;
    uint256 public purchasePrice;
    uint256 public escrowAmount;
    address payable public seller;
    address payable public buyer;
    address public inspector;
    address public lender;
    bool public inspectionpass = false;

    mapping(address => bool) public approval;

    modifier onlyBuyer(){
        require(msg.sender == buyer, "only buyer can call this function");
        _;
    }
    modifier onlyinspector(){
        require(msg.sender == inspector, "only inspector can call this function");
        _;
    }

    receive() external payable{

    }

    constructor(
        address _nftAddress,
        uint256 _nftID,
        uint256 _purchasePrice,
        uint256 _escrowAmount,
        address payable _seller,
        address payable _buyer,
        address _inspector,
        address _lender
    ) {
        nftAddress = _nftAddress;
        nftID = _nftID;
        purchasePrice = _purchasePrice;
        escrowAmount = _escrowAmount;
        seller = _seller;
        buyer = _buyer;
        inspector = _inspector;
        lender = _lender;
    }

    function depositEarnest() public payable onlyBuyer {
        require(msg.value >= escrowAmount, "balance of account is less than escrow amount");
    }

    function updateInspectorStatus(bool _inspectionpass) public onlyinspector {
        inspectionpass = _inspectionpass;
    }

    function approveSale() public {
        approval[msg.sender] = true;
    }

    function getBalance() public view returns(uint) {
        return address(this).balance;
    }

    function cancelSale() public{
        if(inspectionpass == false){
            payable(buyer).transfer(address(this).balance);
        }else{
            payable(seller).transfer(address(this).balance);
        }
    }

    function finalizeSale() public {
        require(inspectionpass, "must pass inspection");
        require(approval[buyer], "must be approved by buyer");
        require(approval[seller], "must be approved by seller");
        require(approval[lender], "must be approved by lender");
        require(address(this).balance >= purchasePrice);

        (bool success, ) = payable(seller).call{ value:address(this).balance }("");
        require(success);

        ERC721(nftAddress).transferFrom(seller, buyer, nftID);
    }
}
