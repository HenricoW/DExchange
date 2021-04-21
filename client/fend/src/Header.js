import Dropdown from './Dropdown'
import React from 'react'

const Header = ({ dex, user, tokens, onSelect, web3 }) => {
    return (
        <header id="header" className="card">
            <div className="row">
                <div className="col-sm-3 flex">
                    <Dropdown 
                        items={tokens.map(item => ({
                            label: web3.utils.hexToUtf8(item.ticker),
                            value: item
                        }))}

                        activeItem={{
                            label: web3.utils.hexToUtf8(user.selectedToken.ticker),
                            value: user.selectedToken
                        }}

                        onSelect={onSelect}
                    />
                </div>
                <div className="col-sm-9">
                    <h4>Dex - <span className="contract-addr">Contract Address: <span className="address">{dex.options.address}</span></span> </h4>
                </div>
            </div>
        </header>
    )
}

export default Header;
