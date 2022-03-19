import Dropdown from "./Dropdown";
import React from "react";

const Header = ({ dex, user, tokens, onSelect, web3 }) => {
  return (
    <header id="header" className="card">
      <div className="row px-5 py-2 d-flex justify-content-between">
        <div className="d-flex">
          <h2 className="mr-5">OB DEX v0.3</h2>
          <div className="col-sm-10s">
            <h6>
              <span className="contract-addr">
                Contract address: <span className="address">{dex.options.address}</span>
              </span>{" "}
            </h6>
            <h6>Connected account: {user.accounts[0]}</h6>
          </div>
        </div>
        <div className="col-sm-2 flex align-items-center" style={{ minWidth: "400px" }}>
          <h4>Current pair: {web3.utils.hexToUtf8(user.selectedToken.ticker)}-DAI</h4>
          <Dropdown
            items={tokens.map((item) => ({
              label: web3.utils.hexToUtf8(item.ticker),
              value: item,
            }))}
            activeItem={{
              label: web3.utils.hexToUtf8(user.selectedToken.ticker),
              value: user.selectedToken,
            }}
            onSelect={onSelect}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
