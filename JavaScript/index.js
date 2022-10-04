const {ChainId, Fetcher, WETH, Route, Trade,TokenAmount,TradeType, Percent} = require('@uniswap/sdk');
const chainId = ChainId.MAINNET;
const ethers = require('ethers');


const tokenAddress = '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2'; // address: MKR
let amount = '100000000000000';

const init = async () => {
    const MKR = await Fetcher.fetchTokenData(chainId,tokenAddress);
    const weth = WETH[chainId];
    
    const pair = await Fetcher.fetchPairData(weth,MKR);
    
    const route = new Route([pair],weth);
    const trade = new Trade(route,new TokenAmount(weth,amount),TradeType.EXACT_INPUT);
    
    console.log('Number of MKR toekns you can get for 1 WETH \n',route.midPrice.toSignificant(6));
    console.log('Number of WETH toekns you can get for 1 MKR \n',route.midPrice.invert().toSignificant(6));
    console.log('Execution price for the amount',amount,'\n',trade.executionPrice.toSignificant(6));
    console.log('Next midprice\n',trade.nextMidPrice.toSignificant(6));

    const slippageTolerance = new Percent('50','10000');
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
    const path = [weth.address,MKR.address];
    const to = '';
    const deadline = Math.floor(Date.now()/1000); // millisec to sec
    const value = trade.inputAmount.raw;

    const provider = ethers.getDefaultProvider('mainnet',{
        infura:'https://mainnet.infura.io/v3/a7e56843080a499980d9767c9dca6bea'
    });

    const signer = new ethers.Wallet('PRIVATE_KEY');
    const account = signer.connect(provider);

    const uniswap = new ethers.Contract(
        '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        ['function swapExactTokensForETH(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)'],
        account
    );

    try{
        const tx  = await uniswap.swapExactTokensForETH(
            amountOutMin,
            path,
            to,
            deadline,
            {value,gasPrice:20e9}
        );
    
        console.log(`Transaction hash: ${tx.hash}`);
        const recipt = await tx.wait();
        console.log(`Transaction was mined in block: ${recipt.blockNumber}`);

    }
    catch(err){
        console.log(err.message);
    }
}

init();
