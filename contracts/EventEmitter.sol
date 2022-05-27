//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

contract EventEmitter is EIP712 {
	using ECDSA for bytes32;

	mapping (bytes32=>bool) public executedOrder;

	event OrderExecuted(address authority, address sender, address recipient, uint amount, string message);

	struct Order {
		address authority;
		address sender;
		address recipient;
		uint256 amount;
		address erc20Token;
		string eventMessage;
	}

	bytes32 constant ORDER_TYPEHASH =
		keccak256(
				"Order(address authority,address sender,address recipient,uint256 amount,address erc20Token,bytes32 eventMessage)"
		);

	constructor() EIP712("EventEmitter", "0.01") {
	}

	function executeOrder(Order calldata _message, bytes calldata authoritySignature, bytes calldata senderSignature) external {
		IERC20 token = IERC20(_message.erc20Token);

		bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
			ORDER_TYPEHASH,
			_message.authority,
			_message.sender,
			_message.recipient,
			_message.amount,
			_message.erc20Token,
			keccak256(bytes(_message.eventMessage))
		)));

		require(digest.recover(authoritySignature) == _message.authority, "Authority signature is invalid");
		require(digest.recover(senderSignature) == _message.sender, "Sender signature is invalid");
		require(executedOrder[digest] == false, "Order already executed");
		
		executedOrder[digest] = true;
		require(token.transferFrom(_message.sender, _message.recipient, _message.amount) == true, "Token transfer failed");
		
		emit OrderExecuted(
			_message.authority,
			_message.sender,
			_message.recipient,
			_message.amount,
			_message.eventMessage
		);
	}
}
