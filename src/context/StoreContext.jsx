import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { food_list as localFoodList } from '../assets/frontend_assets/assets';

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const url = "https://ajay-cafe-1.onrender.com/";
  const [token, setToken] = useState("");
  const [userType, setUserType] = useState("user");
  const [food_list, setFoodList] = useState(localFoodList); 

  // Helper function to get quantity from cart item
  const getCartQuantity = (itemId) => {
    if (!cartItems[itemId]) return 0;
    if (typeof cartItems[itemId] === 'number') {
      return cartItems[itemId];
    }
    return cartItems[itemId].quantity || 0;
  };

  // Helper function to get notes from cart item
  const getCartNotes = (itemId) => {
    if (!cartItems[itemId]) return "";
    if (typeof cartItems[itemId] === 'number') {
      return "";
    }
    return cartItems[itemId].notes || "";
  };

  // Helper function to update cart notes
  const updateCartNotes = (itemId, notes) => {
    setCartItems((prev) => {
      const currentItem = prev[itemId];
      if (typeof currentItem === 'number') {
        return { ...prev, [itemId]: { quantity: currentItem, notes: notes } };
      }
      return { ...prev, [itemId]: { ...currentItem, notes: notes } };
    });
  };

  // Add to cart - uses updateCart API with new quantity
  const addToCart = async (itemId, notes = "") => {
    // Update local state optimistically
    let newQuantity;
    setCartItems((prev) => {
      const currentItem = prev[itemId];
      if (!currentItem) {
        newQuantity = 1;
        return { ...prev, [itemId]: { quantity: 1, notes: notes } };
      } else if (typeof currentItem === 'number') {
        newQuantity = currentItem + 1;
        return { ...prev, [itemId]: { quantity: newQuantity, notes: notes || "" } };
      } else {
        newQuantity = currentItem.quantity + 1;
        const existingNotes = currentItem.notes || "";
        return { 
          ...prev, 
          [itemId]: { 
            quantity: newQuantity, 
            notes: notes || existingNotes 
          } 
        };
      }
    });

    // Sync with backend if logged in
    if (token) {
      try {
        const response = await axios.put(
          url + "/api/cart/updateCart",
          { 
            foodId: itemId,
            quantity: newQuantity
          },
          { headers: { token } }
        );
        
        if (response.data.success) {
          toast.success("Item added to cart");
        } else {
          toast.error("Something went wrong");
          // Revert on error
          setCartItems((prev) => {
            const item = prev[itemId];
            if (item.quantity === 1) {
              const { [itemId]: removed, ...rest } = prev;
              return rest;
            }
            return { 
              ...prev, 
              [itemId]: { ...item, quantity: item.quantity - 1 } 
            };
          });
        }
      } catch (error) {
        console.error("Error adding to cart:", error);
        toast.error("Failed to add item to cart");
        // Revert on error
        setCartItems((prev) => {
          const item = prev[itemId];
          if (item.quantity === 1) {
            const { [itemId]: removed, ...rest } = prev;
            return rest;
          }
          return { 
            ...prev, 
            [itemId]: { ...item, quantity: item.quantity - 1 } 
          };
        });
      }
    }
  };

  // Remove from cart - uses updateCart API with reduced quantity
  const removeFromCart = async (itemId) => {
    let newQuantity;
    
   
    setCartItems((prev) => {
      const currentItem = prev[itemId];
      if (!currentItem) return prev;
      
      if (typeof currentItem === 'number') {
        newQuantity = currentItem - 1;
        if (newQuantity <= 0) {
          const { [itemId]: removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [itemId]: newQuantity };
      } else {
        newQuantity = currentItem.quantity - 1;
        if (newQuantity <= 0) {
          const { [itemId]: removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [itemId]: { ...currentItem, quantity: newQuantity } };
      }
    });
    if (token) {
      try {
        const response = await axios.put(
          url + "/api/cart/updateCart",
          { 
            foodId: itemId,
            quantity: newQuantity
          },
          { headers: { token } }
        );
        
        if (response.data.success) {
          toast.success("Item removed from cart");
        } else {
          toast.error("Something went wrong");
        }
      } catch (error) {
        console.error("Error removing from cart:", error);
        toast.error("Failed to remove item from cart");
      }
    }
  };
    // Remove item completely from cart (delete API)
  const removeItemCompletely = async (itemId) => {
    if (!token) {
      toast.error("Please login first");
      return;
    }

    try {
      const response = await axios.delete(`${url}/api/cart/remove/${itemId}`, {
        headers: { token },
      });

      if (response.data.success) {
        toast.success("Item removed completely");
        // Update local cart state to remove the item
        setCartItems((prev) => {
          const { [itemId]: removed, ...rest } = prev;
          return rest;
        });
      } else {
        toast.error(response.data.message || "Failed to remove item");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Server error while removing item");
    }
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      const quantity = getCartQuantity(item);
      if (quantity > 0) {
        let itemInfo = food_list.find((product) => product._id === item);
        if (itemInfo) {
          totalAmount += itemInfo.price * quantity;
        }
      }
    }
    return totalAmount;
  };

  const getTotalCartItems = () => {
    let totalItems = 0;
    for (const item in cartItems) {
      totalItems += getCartQuantity(item);
    }
    return totalItems;
  };

  const fetchFoodList = async () => {
    try {
      const response = await axios.get(url + "/api/food/list");
      if (response.data.success) {
        setFoodList(response.data.data);
      } else {
        alert("Error! Products are not fetching..");
      }
    } catch (error) {
      console.error("Error fetching food list:", error);
    }
  };

  const loadCardData = async (token) => {
    try {
      const response = await axios.get(
        url + "/api/cart/get",
        { headers: { token } }
      );
      setCartItems(response.data.cartData || {});
    } catch (error) {
      console.error("Failed to load cart data", error);
      setCartItems({});
    }
  };

  useEffect(() => {
    async function loadData() {
      // await fetchFoodList(); 
      if (localStorage.getItem("token")) {
        setToken(localStorage.getItem("token"));
        const savedUserType = localStorage.getItem("userType") || "user";
        setUserType(savedUserType);
        await loadCardData(localStorage.getItem("token"));
      }
    }
    loadData();
  }, []);

  const contextValue = {
    food_list,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    getTotalCartItems,
    getCartQuantity,
    getCartNotes,
    updateCartNotes,
    url,
    token,
    setToken,
    userType,
    setUserType,
    removeItemCompletely,
  };
  
  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;