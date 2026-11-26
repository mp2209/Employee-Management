package com.example.rewardpoint.repository;

import com.example.rewardpoint.model.Point;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PointRepository extends MongoRepository<Point, ObjectId> {
    Optional<Point> findByUid(Long uid);

    boolean existsByUid(Long uid);
}
