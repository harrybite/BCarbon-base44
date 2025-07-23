// ragistration 
import { apihost } from '@/components/contract/address';
import { thirdwebclient } from '@/thirwebClient';
import { useState } from 'react';
import { bscTestnet } from 'thirdweb/chains';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { createWallet } from 'thirdweb/wallets';

const Register = () => {
  const [role, setRole] = useState("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const account = useActiveAccount();

  // Handles registration for both User and VVB
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Validation: wallet address must be present
    if (!account?.address) {
      setMessage("Please connect your wallet.");
      setLoading(false);
      return;
    }
    if (!email || !password) {
      setMessage("Email and password are required.");
      setLoading(false);
      return;
    }

    try {
      let endpoint = "";
      let body = {};

      if (role === "vvb") {
        // VVB registration expects: walletAddress, email, password
        endpoint = `${apihost}/vvb/complete-registration`;
        body = {
          walletAddress: account.address,
          email,
          password,
        };
      } else {
        // User registration expects: walletAddress, email, password
        endpoint = `${apihost}/user/sign-up`;
        body = {
          walletAddress: account.address,
          email,
          password,
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Registration successful! You can now log in.");
      } else {
        setMessage(data.message || "Registration failed.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setMessage("Registration failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full p-6 bg-white rounded shadow">
          <h2 className="text-2xl font-bold mb-4">Register</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="user">User</option>
                <option value="vvb">VVB</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Wallet Address</label>
              <div className="flex gap-1">
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
              className="w-full bg-green-600 text-white py-2 rounded font-semibold"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>
            {message && (
              <div className="mt-2 text-center text-sm text-red-600">{message}</div>
            )}
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Login here
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;