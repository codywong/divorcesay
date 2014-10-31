var WatsonFilms = WatsonFilms || {};

WatsonFilms.App = function() {
    // The current Slick Carousel index
    var slickIndex = 0;
    
    // Initialize sample questions dropdown button
    var initSampleQuestions = function() {
        var searchForm = $("#searchForm");
        var samples = $('#sampleQuestions ul');
        var questions = [
                         'Which movie is about a fetus floating above the Earth?',
                         'What is important for synchronous sound film making?',
                         'How is tachometer used during film making?',
                         'What is Rank-Cintel telecine?',
                         'When were the first Outstanding Achievement Awards held?',
                         'What was the conversation between Glennon and Jack Warner about?',
                         'Where did the actors who played the roles of small aliens in the final scene of Close Encounters of the Third Kind hail from?',
                         'Why did Speilberg choose the girls from Mobile for Close Encounters of the Third Kind?',
                         'Was Zhivago shown in Russia in 2001?'
                         ];
        
        // Add sample questions to the dropdown list
        for (var i = 0; i < questions.length; i++) {
            samples.append('<li><a class="sampleQuestion"><i class="icon-arrow-up"></i> '+questions[i]+'</a><li>');
        }
        
        $('.sampleQuestion').click(function(e) {
            // On click, get the selected question text and submit the form 
            $('#searchTerm').val($(this).text());
            searchForm.submit();
            e.preventDefault();
        });
        
    };

    // Create a modal dialog to host an answer's evidence
    var createEvidenceModal = function(i, r) {
        var evidenceModal = $('#evidence').clone();
        if (r.question.evidencelist === undefined) {
            return evidenceModal;
        }
        var evidence = r.question.evidencelist[i];
        evidenceModal.attr('id', 'evidence-' + i);
        evidenceModal.find('#text').text(evidence.text);
        evidenceModal.find('#title').text(evidence.title);
        evidenceModal.find('#copyright').text(evidence.copyright);
        evidenceModal.insertAfter('#evidence');
        return evidenceModal;
    };
    
    // Create a 'Slick Carousel' slide that hosts an answer
    // and its confidence
    var createAnswerSlide = function(i, r) {
        var answer = r.question.answers[i];
        var answerContainerDiv, answerDiv, confidenceDiv, evidenceRef;

        answerContainerDiv = $("<div>");
        answerDiv = $("<div>", {
            id : 'answer' + i,
            'text' : answer.text,
            'class' : 'answerContent'
        });

        answerContainerDiv = $("<div>", {
            id : 'panswer' + i
        });
        answerDiv.appendTo(answerContainerDiv);

        createEvidenceModal(i, r);

        evidenceRef = $('<a>', {
            'href' : '#',
            'id' : 'evidence' + i,
            'text' : (answer.confidence * 100).toFixed(2) + "%",
            'class' : 'clink' + i,
            'onclick' : "$('#evidence-" + i + "').modal('show'); return false;"
        });

        confidenceDiv = $("<div>", {
            'class' : 'confidence',
            'text' : 'Confidence: '
        });

        evidenceRef.appendTo(confidenceDiv);

        confidenceDiv.appendTo(answerContainerDiv);
        return answerContainerDiv;
    };
    
    // Display the answers return in the response, r, in
    // 'Slick Carousel' slides.
    var displayAnswers = function(r) {
        var answerCarousel = $("#answerCarousel");
        var answerText = "Hmm. I'm not sure.";
        slickIndex = 0;

        if (r.question.answers[0] !== undefined) {
            answerText = r.question.answers[0].text
            console.log('answer: ' + answerText);
            slickIndex = r.question.answers.length;
        }

        answerCarousel.show();

        // Add slides containing answers to the 'Slick Carousel' 
        for (var i = 0; i < slickIndex; i++) {
            $('#panswer' + i).remove();
            answerCarousel.slickAdd(createAnswerSlide(i, r));
        }

        // Set to the first answer slide
        answerCarousel.slickGoTo(0);
    };

    // Clear and hide the 'Slick Carousel' answer slides
    var clearAnswers = function() {
        var answerCarousel = $('#answerCarousel');
        for (var i = slickIndex - 1; i >= 0; i--) {
            answerCarousel.slickRemove(i);
        }
        slickIndex = 0;
        answerCarousel.hide();
    };
    
    // Ask a question.
    // Invoke the Node.js REST service. The Node.js
    // service, in turn, invokes the IBM Watson QAAPI
    // and returns to us the QAAPI response
    var ask = function(question) {     
        var searchTerm = $("#searchTerm");
        var samples = $('.dropDownSampleQuestion');
        // Create a Ladda reference object 
        var l = Ladda.create(document.querySelector('button'));
        
        // Clear answers,disable search, and start the progress indicator
        clearAnswers()
        searchTerm.attr("disabled", "disabled");
        samples.attr("disabled", "disabled");
        l.start();
        
        // Form a question request to send to the Node.js REST service
        var questionEntity = {
            'question' : question
        };

        // POST the question request to the Node.js REST service
        $.ajax({
            type : 'POST',
            data : questionEntity,
            dataType : "json",
            url : '/question',
            success : function(r, msg) {
                // Enable search and stop the progress indicator
                searchTerm.removeAttr("disabled");
                samples.removeAttr("disabled");
                l.stop();
                
                // Display answers or error
                if (r.question !== undefined) {
                    displayAnswers(r);
                } else {
                    alert(r);
                }
            },
            error : function(r, msg, e) {
                // Enable search and stop progress indicator
                searchTerm.removeAttr("disabled");
                samples.removeAttr("disabled");
                l.stop();
                
                // Display error
                if (r.responseText) {
                	alert(e+' '+r.responseText);	
                } else {
                	alert(e);
                }
                
            }
        });
    };

    // Initialize the application
    var init = function() {
        var searchForm = $("#searchForm");
        var searchTerm = $("#searchTerm");

        searchTerm.focus();
        
        clearAnswers();

        // Wire the search for to ask a question
        // on submit
        searchForm.submit(function(e) {
            ask(searchTerm[0].value);
        });

        // Wire the search input box to submit
        // on <enter>
        searchTerm.on('keyup', function(e) {
            if (e.which === 13) {
                searchForm.submit();
            }
        });

        // Initialize the 'Slick Carousel'
        $('.single-item').slick({
            dots : true,
            infinite : true,
            speed : 300,
            slidesToShow : 1,
            slidesToScroll : 1
        });
        
        // Initialize the sample questions dropdown
        initSampleQuestions();
    };

    // Expose privileged methods
    return {
        init : init
    };
}();