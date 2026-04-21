import { Link } from 'react-router-dom';

export default function RestaurantCard({ restaurant }) {
  return (
    <Link to={`/restaurants/${restaurant._id}`} className="card hover:shadow-md transition hover:-translate-y-1 block">
      <div className="h-44 overflow-hidden">
        <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-bold text-gray-900 text-lg">{restaurant.name}</h3>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${restaurant.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {restaurant.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
        <p className="text-gray-500 text-sm mb-3 line-clamp-1">{restaurant.description}</p>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>⭐ {restaurant.rating}</span>
          <span>•</span>
          <span>🕐 {restaurant.deliveryTime}</span>
          <span>•</span>
          <span>🚚 ${restaurant.deliveryFee}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-3">

          {/* Line 25 - handle both string and array */}
          {Array.isArray(restaurant.cuisine)
            ? restaurant.cuisine.map(c => (
              <span key={c} className="bg-orange-50 text-orange-600 text-xs px-2 py-1 rounded-full font-medium">{c}</span>
            ))
            : restaurant.cuisine && (
              <span className="bg-orange-50 text-orange-600 text-xs px-2 py-1 rounded-full font-medium">{restaurant.cuisine}</span>
            )
          }

        </div>
      </div>
    </Link>
  );
}