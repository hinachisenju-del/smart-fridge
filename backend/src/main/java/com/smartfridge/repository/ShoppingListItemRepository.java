package com.smartfridge.repository;

import com.smartfridge.entity.ShoppingListItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShoppingListItemRepository extends JpaRepository<ShoppingListItem, Long> {

    List<ShoppingListItem> findByPurchased(boolean purchased);

    void deleteByPurchasedTrue();

    List<ShoppingListItem> findByShoppingListId(Long shoppingListId);

    List<ShoppingListItem> findByShoppingListIdAndPurchased(Long shoppingListId, boolean purchased);

    long countByShoppingListId(Long shoppingListId);

    long countByShoppingListIdAndPurchasedFalse(Long shoppingListId);

    void deleteByShoppingListIdAndPurchasedTrue(Long shoppingListId);
}
