import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../utils/api';
import RestaurantCard from '../components/RestaurantCard';

export default function Home() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get('/restaurants').then(res => setFeatured(res.data.restaurants?.slice(0, 3) || []));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h1 className="text-5xl font-extrabold leading-tight mb-4">
              Delicious Food,<br />
              <span className="text-orange-100">Delivered Fast 🚀</span>
            </h1>
            <p className="text-orange-100 text-lg mb-8 max-w-md">
              Delicious meals, made with heart,
               A perfect taste in every part
            </p>
            <Link to="/restaurants" className="bg-white text-orange-600 font-bold py-3 px-8 rounded-xl hover:bg-orange-50 transition text-lg inline-block">
              Order Now
            </Link>
          </div>
          <div className="text-9xl hidden md:block">🍕</div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Cuisine</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { emoji: '🍔', label: 'Burgers', cuisine: 'Burgers' },
            { emoji: '🍕', label: 'Pizza', cuisine: 'Pizza' },
            { emoji: '🍣', label: 'Sushi', cuisine: 'Sushi' },
            { emoji: '🌮', label: 'Mexican', cuisine: 'Mexican' },
          ].map(c => (
            <Link key={c.label} to={`/restaurants?cuisine=${c.cuisine}`}
              className="card p-6 text-center hover:shadow-md transition hover:-translate-y-1 cursor-pointer">
              <div className="text-4xl mb-2">{c.emoji}</div>
              <div className="font-semibold text-gray-700">{c.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Restaurants</h2>
          <Link to="/restaurants" className="text-orange-500 font-semibold hover:underline">View all →</Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {featured.map(r => <RestaurantCard key={r._id} restaurant={r} />)}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-orange-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { step: '1', emoji: '🔍', title: 'Choose Restaurant', desc: 'Browse local restaurants and menus' },
              { step: '2', emoji: '🛒', title: 'Add to Cart', desc: 'Select your favorite items' },
              { step: '3', emoji: '🚚', title: 'Fast Delivery', desc: 'Get food delivered to your door' },
            ].map(s => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="w-16 h-16 bg-orange-500 text-white rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-lg">{s.emoji}</div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
