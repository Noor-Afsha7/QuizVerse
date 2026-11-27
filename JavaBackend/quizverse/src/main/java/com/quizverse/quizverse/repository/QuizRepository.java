package com.quizverse.quizverse.repository;

import com.quizverse.quizverse.Entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
}