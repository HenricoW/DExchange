import Dropdown from './Dropdown'
import React from 'react'

const Header = ({ dex, user, tokens, onSelect, web3 }) => {
    return (
        <header id="header" className="card">
            <div className="row">
                <div className="col-sm-2 flex">
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
                <div className="col-sm-10s">
                    <h4>Ash Exchange</h4>
                    <h6><span className="contract-addr">Address: <span className="address">{dex.options.address}</span></span> </h6>
                </div>
            </div>
        </header>
    )
}

export default Header;
