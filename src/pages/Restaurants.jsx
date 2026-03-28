import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import RestaurantCard from '../components/RestaurantCard';

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const cuisine = searchParams.get('cuisine') || '';

  useEffect(() => {
    fetchRestaurants();
  }, [cuisine]);

  const fetchRestaurants = async (q = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      if (cuisine) params.set('cuisine', cuisine);
      const res = await api.get(`/restaurants?${params}`);
      setRestaurants(res.data.restaurants || []);
    } catch {}
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRestaurants(search);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        {cuisine ? `${cuisine} Restaurants` : 'All Restaurants'}
      </h1>
      <p className="text-gray-500 mb-8">Find the best food near you</p>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8 max-w-lg">
        <input
          type="text"
          placeholder="Search restaurants..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input"
        />
        <button type="submit" className="btn-primary whitespace-nowrap">Search</button>
      </form>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-44 bg-gray-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-xl font-semibold">No restaurants found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {restaurants.map(r => <RestaurantCard key={r._id} restaurant={r} />)}
        </div>
      )}
    </div>
  );
}
