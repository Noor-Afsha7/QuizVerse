
package com.quizverse.quizverse.controller;

import com.quizverse.quizverse.Entity.Question;
import com.quizverse.quizverse.repository.QuestionRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@CrossOrigin(origins = "*")
public class QuestionController {

    private final QuestionRepository questionRepository;

    public QuestionController(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    // GET ALL QUESTIONS
    @GetMapping
    public List<Question> getAllQuestions() {
        return questionRepository.findAll();
    }

    // GET QUESTIONS BY QUIZ ID
    @GetMapping("/quiz/{quizId}")
    public List<Question> getQuestionsByQuiz(@PathVariable Long quizId) {
        return questionRepository.findByQuizId(quizId);
    }

    // GET QUESTION BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Question> getQuestionById(@PathVariable Long id) {
        return questionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // CREATE QUESTION
    @PostMapping
    public Question createQuestion(@RequestBody Question question) {
        return questionRepository.save(question);
    }

    // UPDATE QUESTION
    @PutMapping("/{id}")
    public ResponseEntity<Question> updateQuestion(
            @PathVariable Long id,
            @RequestBody Question updatedQuestion) {

        return questionRepository.findById(id).map(question -> {
            question.setQuizId(updatedQuestion.getQuizId());
            question.setQuestionText(updatedQuestion.getQuestionText());
            question.setOptionA(updatedQuestion.getOptionA());
            question.setOptionB(updatedQuestion.getOptionB());
            question.setOptionC(updatedQuestion.getOptionC());
            question.setOptionD(updatedQuestion.getOptionD());
            question.setCorrectAnswer(updatedQuestion.getCorrectAnswer());
            question.setMarks(updatedQuestion.getMarks());

            return ResponseEntity.ok(questionRepository.save(question));

        }).orElse(ResponseEntity.notFound().build());
    }

    // DELETE QUESTION
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {

        if (!questionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        questionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
