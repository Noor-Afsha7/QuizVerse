
package com.quizverse.quizverse.controller;

import com.quizverse.quizverse.Entity.Result;
import com.quizverse.quizverse.repository.ResultRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/results")
@CrossOrigin(origins = "*")
public class ResultController {

    private final ResultRepository resultRepository;

    public ResultController(ResultRepository resultRepository) {
        this.resultRepository = resultRepository;
    }

    @GetMapping
    public List<Result> getAllResults() {
        return resultRepository.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<Result> getUserResults(@PathVariable Long userId) {
        return resultRepository.findByUserId(userId);
    }

    @PostMapping
    public ResponseEntity<?> saveResult(@RequestBody Result result) {

        if (result.getUserId() == null ||
            result.getQuizId() == null ||
            result.getScore() == null ||
            result.getCorrectAnswers() == null ||
            result.getIncorrectAnswers() == null ||
            result.getTotalQuestions() == null ||
            result.getPercentage() == null) {

            return ResponseEntity.badRequest()
                    .body("All result fields are required.");
        }

        return ResponseEntity.ok(resultRepository.save(result));
    }
}
