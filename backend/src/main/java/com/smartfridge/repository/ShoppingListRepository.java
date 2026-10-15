package com.smartfridge.repository;

import com.smartfridge.entity.ShoppingList;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShoppingListRepository extends JpaRepository<ShoppingList, Long> {

    List<ShoppingList> findByIsArchivedFalseOrderByCreatedAtAsc();

    List<ShoppingList> findByIsArchivedTrueOrderByUpdatedAtDesc();

    Optional<ShoppingList> findByIsDefaultTrue();

    Optional<ShoppingList> findFirstByIsArchivedFalseOrderByCreatedAtAsc();

    Optional<ShoppingList> findFirstByOrderByCreatedAtAsc();

    Optional<ShoppingList> findByTitleIgnoreCase(String title);

    boolean existsByTitleIgnoreCase(String title);

    boolean existsByTitleIgnoreCaseAndIdNot(String title, Long id);
}
