import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  TreePine, 
  TrendingUp, 
  Shield, 
  Globe,
  ArrowRight,
  Leaf,
  Zap,
  Users
} from "lucide-react";
import WalletConnection from "../components/wallet/WalletConnection";

export default function Home() {
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          setIsConnected(accounts.length > 0);
        } catch (error) {
          console.log('Error checking wallet:', error);
        }
      }
    };
    checkConnection();
  }, []);

  const features = [
    {
      icon: TreePine,
      title: "Carbon Credit Projects",
      description: "Browse and invest in verified carbon reduction projects worldwide",
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      icon: TrendingUp,
      title: "Decentralized Trading",
      description: "Trade carbon credits peer-to-peer with full transparency",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      icon: Shield,
      title: "Blockchain Security",
      description: "All transactions secured by Ethereum smart contracts",
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      icon: Globe,
      title: "Global Impact",
      description: "Make a real difference in the fight against climate change",
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    }
  ];

  const stats = [
    { value: "1M+", label: "CO₂ Tons Offset", icon: Leaf },
    { value: "500+", label: "Active Projects", icon: TreePine },
    { value: "10K+", label: "Community Members", icon: Users },
    { value: "24/7", label: "Always Trading", icon: Zap }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Decentralized
              <span className="block text-green-600">
                Carbon Credits
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Trade, mint, and retire carbon credits on the blockchain. 
              Join the future of carbon offsetting with BCO<sub>2</sub> - 
              where transparency meets sustainability.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {isConnected ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to={createPageUrl("Projects")}>
                  <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
                    <TreePine className="w-5 h-5 mr-2" />
                    Browse Projects
                  </Button>
                </Link>
                <Link to={createPageUrl("Trade")}>
                  <Button size="lg" variant="outline" className="px-8 py-3">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Start Trading
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <WalletConnection />
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose BCO<sub>2</sub>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines the power of blockchain technology with 
              real-world environmental impact
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to start your carbon offset journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Connect Wallet",
                description: "Connect your Web3 wallet to access the platform"
              },
              {
                step: "02",
                title: "Browse Projects",
                description: "Explore verified carbon reduction projects"
              },
              {
                step: "03",
                title: "Mint & Trade",
                description: "Mint carbon credits or trade with other users"
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Make an Impact?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of users already trading carbon credits on BCO<sub>2</sub>
          </p>
          {!isConnected && (
            <div className="max-w-md mx-auto">
              <WalletConnection />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}