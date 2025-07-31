import { apihost } from '@/components/contract/address';
import { thirdwebclient } from '@/thirwebClient';
import { useState } from 'react';
import { bscTestnet } from 'thirdweb/chains';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { createWallet } from 'thirdweb/wallets';
import { useNavigate } from "react-router-dom";


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const account = useActiveAccount();
  const navigate = useNavigate();
 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      let endpoint = "";
      let body = {};

      if (role === "vvb") {
        endpoint = `${apihost}/vvb/login`;
        body = { 
          walletAddress: account?.address, 
          email, 
          password 
        };
      } else if (role === "gov") {
        endpoint = `${apihost}/gov/login`;
        body = { 
          walletAddress: account?.address, 
          email, 
          password 
         };
      } else {
        endpoint = `${apihost}/user/login`;
        body = { 
          walletAddress: account?.address, 
          email, 
          password,
          role // Include role for User login
         };
      }
      console.log("api endpoint", endpoint);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Login successful!");
        localStorage.setItem("token", data.token);
         navigate("/");
      } else {
        console.error("Login failed:", data);
        setMessage(data.message || "Login failed.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setMessage("Login failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full p-6 bg-white rounded shadow">
          <h2 className="text-2xl font-bold mb-4">Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="issuer">Issuer</option>
                <option value="vvb">VVB</option>
                <option value="gov">Gov</option>
                 <option value="user">User</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Wallet Address</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={account?.address || ""}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Connect your wallet"
                  disabled
                  readOnly
                />
                 <ConnectButton
                    client={thirdwebclient}
                    wallets={[
                      createWallet("io.metamask"),
                    ]}
                    chain={bscTestnet}
                    data-testid="tw-connect-btn"
                  />
              </div>
            </div>
            <div>
              <label className="block mb-1 font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded font-semibold"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
            {message && (
              <div className="mt-2 text-center text-sm text-red-600">{message}</div>
            )}
          </form>
          <div className="mt-4 text-center text-sm">
            {"Don't have an account?"}{" "}
            <a href="/ragister" className="text-blue-600 hover:underline">
              Create a new account
            </a>
          </div>
        </div>
      </main>

    </div>
  );
};

export default Login;