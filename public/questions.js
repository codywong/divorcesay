var Divorcesay = Divorcesay || {};

Divorcesay.App = function() {
    // The current Slick Carousel index
    var slickIndex = 0;
    var askIndex = -1;

    var defaultSuggestedQuestions = [
                         'Where do I go to get a divorce?',
                         'How long is the divorce process?',
                         'How long do I need to be separated before I can apply for a divorce?',
                         'Can I prevent my spouse from having child custody?',
                         'I do not have enough money to get a lawyer, what should I do?'
                         ];


    // Initialize recommended questions
    var setUpRecommendedQuestions = function(questions) {
        if (!questions) questions = defaultSuggestedQuestions;
        var searchForm = $("#searchForm");
        var samples = $('#recQuestionsList');
        samples.empty();

        // Add sample questions to the dropdown list
        for (var i = 0; i < questions.length; i++) {
            samples.append('<li><a class="sampleQuestion">'+questions[i]+'</a></li>');
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
        if (r.question.evidencelist === undefined &&
            r.answer === undefined) {
            return evidenceModal;
        }
        if (r.question.evidencelist === undefined) {

            // for formatted text
            var ans = JSON.parse(r.evidence);
            var source = JSON.parse(r.answer);

            // for evidencelist text
            // var ans = JSON.parse(r.answer);

            var evidence = ans[0];
            evidenceModal.find('#actualConfidence').text(r.confidenceValue);
            evidenceModal.find('#title').text(source[0].title.split(":")[0]);
        } else {
            var evidence = r.question.answers[0];
            evidenceModal.find('#actualConfidence').text(r.confidence.val);
            evidenceModal.find('#title').text(r.question.evidencelist[0].title.split(":")[0]);
        }

        evidenceModal.attr('id', 'evidence-' + i);
        evidenceModal.find('#text').append(evidence.formattedText);
        // evidenceModal.find('#title').text(evidence.title);
        // evidenceModal.find('#copyright').text(evidence.copyright);
        evidenceModal.insertAfter('#evidence');
        return evidenceModal;
    };
    
    // Create a 'Slick Carousel' slide that hosts an answer
    // and its confidence
    var createAnswerSlide = function(i, r) {
        var answer = r.question.evidencelist[i];
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
            'text' : (r.question.answers[i].confidence * 100).toFixed(2) + "%",
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
        
        if(!question) return;

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
                    updateResults(r);
                } /*else {
                    alert(r);
                }*/
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
    
    var updateResults = function(r) {
        $('#searchTerm').val("");
        var historyList = $('#history');
        var source = r.question.evidencelist[0].title.split(":");
                
        createEvidenceModal(askIndex, r);
        evidenceRef = $('<a>', {
            'href' : '#',
            'id' : 'evidence0' + askIndex,
            'text' : 'See More',
            'class' : 'clink' + askIndex,
            'onclick' : "$('#evidence-" + askIndex + "').modal('show'); return false;"
        });
        askIndex -= 1;

        // for formatted text
        // historyList.prepend('<div class="searches">' + '<p class="historyQ">' + r.question.questionText + '</p>'
        //                     + '<p class="confidence"> Confidence: </p>'
        //                     + '<p class="' + r.confidence.colorIndicator + ' confidence">' 
        //                         + r.confidence.level + '&nbsp;&nbsp;&nbsp;' + evidenceRef[0].outerHTML + '</p>'
        //                     + '<br><br>'
        //                     + '<div class="answer">' + r.question.answers[0].formattedText + '</div>'
        //                     +'</div>');

        // for evidencelist text
        // historyList.prepend('<div class="searches">' + '<p class="historyQ">' + r.question.questionText + '</p>'
        //                     + '<p class="confidence"> Confidence: </p>'
        //                     + '<p class="' + r.confidence.colorIndicator + ' confidence">' 
        //                         + r.confidence.level + '&nbsp;&nbsp;&nbsp;' + evidenceRef[0].outerHTML + '</p>'
        //                     + '<br><br>'
        //                     + '<p class="answer">' + r.question.evidencelist[0].text + '</p>'
        //                     +'</div>');

        historyList.prepend('<div class="searches">' + '<p class="historyQ">' + r.question.questionText + '</p><br>');
        if (r.confidence.level == "LOW") {
            historyList.find("div:eq(0)").append('<p class="confidence">We are not so sure about this answer - maybe try rewording your question.</p>' + '<br><br>');
        }
        // historyList.find("div:eq(0)").append('<p class="answer">' 
        //                 + r.question.answers[0].formattedText + '</p>' + '<br>' + '<p class="source"> Source:' + '&nbsp;&nbsp;' + evidenceRef[0].outerHTML + '</p>'
        //                 + '</div>');
        historyList.find("div:eq(0)").append('<p class="answer">' 
                        + r.question.answers[0].formattedText + '</p>' + '<br>' + '<p class="source">' + evidenceRef[0].outerHTML + '</p>'
                        + '</div>');
        

        historyList.children().first().hide().slideDown(1500)
            .animate( { opacity: 1 }, { queue: false, duration: 1500 } );

        updateSuggestions(r.suggestions);
        updateRecentQuestions(r.question);
    };

    // update suggested questions, advertisement and ToDo
    var updateSuggestions = function(suggestions) {
        var adBox = document.getElementById("advertisement");
        var adwords = $("adText");

        adBox.innerHTML = "Going through a divorce is hard. We understand and are here to help. "
                            + "We've partnered with " + suggestions.advertisement + ".<br><br> "
                            + "<a href=" + suggestions.url + ">Click here</a>"
                            + " to get access to special discount rates.";

        if (suggestions.url == "/discounts#childCare" && $('#todoList').find("li").length == 2 ) {
            var test = $('#todoList');
            // console.log(test);
            $('#todoList').append('<li><a href="http://www.ontariocourtforms.on.ca/forms/family/08/FLR-08-Oct12.pdf">Form 8: Application (General)</a></li>');
            $('#todoList').append('<li><a href="http://www.ontariocourtforms.on.ca/forms/family/35.1/FLR-35-1-Nov09-EN.pdf">'+
                                        'Form 35.1: Affidavit in Support of Claim for Custody or Access</a></li>');
        }

        setUpRecommendedQuestions(suggestions.questions);
    };

    var updateRecentQuestions = function(question) {
        var searchForm = $("#searchForm");
        var recent = $('#recentQList');
        // show recents div if it was previously hidden
        $('#recentQ').show().slideDown(1000).animate( { opacity: 0.9 }, { queue: false, duration: 1000 } );
        if (recent.find("li").length > 4) {
            recent.find("li:eq(4)").slideUp(1000).animate( { opacity: 0 }, { queue: false, duration: 1000 },"{}", 
            function(){$(this).remove();} );
        }
        recent.prepend('<li><a class="recentQuestion">' + question.questionText + '</a></li>').children()
            .first().hide().slideDown(1000).animate( { opacity: 1 }, { queue: false, duration: 1000 } );
        
        $('.recentQuestion').click(function(e) {
            // On click, get the selected question text and submit the form 
            $('#searchTerm').val($(this).text());
            //searchForm.submit();
            e.preventDefault();
        });
    }

    var displayHistory = function() {
        var historyList = $('#history');
        var recent = $('#recentQList');

        // hide recent questions if no questions were asked yet
        if (!savedSearches.length) {
            $('#recentQ').hide();
        }

        for (var i = 0; i < savedSearches.length; i++){
            var ans = JSON.parse(savedSearches[i].answer);
            var formatted = JSON.parse(savedSearches[i].evidence);
            var source = ans[0].title.split(":");

            createEvidenceModal(i, savedSearches[i]);
            evidenceRef = $('<a>', {
            'href' : '#',
            'id' : 'evidence' + i,
            'text' : 'See More',
            'class' : 'clink' + i,
            'onclick' : "$('#evidence-" + i + "').modal('show'); return false;"
            });

            // for evidencelist text
            // historyList.append('<div class="searches">' + '<p class="historyQ">' + savedSearches[i].question + '</p>'
            //                 + '<p class="confidence"> Confidence: </p>'
            //                 + '<p class="' + savedSearches[i].confidenceColor + ' confidence">' 
            //                     + savedSearches[i].confidenceLevel + '&nbsp;&nbsp;&nbsp;' + evidenceRef[0].outerHTML + '</p>'
            //                 + '<br><br>'
            //                 + '<p class="answer">' + ans[0].text + '</p>'
            //                 +'</div>');

            // for formatted text
            // historyList.append('<div class="searches">' + '<p class="historyQ">' + savedSearches[i].question + '</p>'
            //                 + '<p class="confidence"> Confidence: </p>'
            //                 + '<p class="' + savedSearches[i].confidenceColor + ' confidence">' 
            //                     + savedSearches[i].confidenceLevel + '&nbsp;&nbsp;&nbsp;' + evidenceRef[0].outerHTML + '</p>'
            //                 + '<br><br>'
            //                 + '<div class="answer">' + ans[0].formattedText + '</div>'
            //                 +'</div>');

            historyList.append('<div class="searches">' + '<p class="historyQ">' + savedSearches[i].question + '</p><br>');
            if (savedSearches[i].confidenceLevel == "LOW") {
                historyList.find('div:eq(' + i +')').append('<p class="confidence">We are not so sure about this answer - maybe try rewording your question.</p>' + '<br><br>');
            }
            // historyList.find('div:eq(' + i +')').append('<p class="answer">' 
            //             + formatted[0].formattedText + '</p>' + '<br>' + '<p class="source"> Source:' + '&nbsp;&nbsp;' + evidenceRef[0].outerHTML + '</p>'
            //             + '</div>');
            historyList.find('div:eq(' + i +')').append('<p class="answer">' 
                        + formatted[0].formattedText + '</p>' + '<br>' + '<p class="source">' + evidenceRef[0].outerHTML + '</p>'
                        + '</div>');

            if (recent.find("li").length < 5) {
                recent.append('<li><a class="recentQuestion">' + savedSearches[i].question + '</a></li>');
            }
        }

        $('.recentQuestion').click(function(e) {
            // On click, get the selected question text and submit the form 
            $('#searchTerm').val($(this).text());
            //$('#searchTerm').submit();
            e.preventDefault();
        });
    }


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
        setUpRecommendedQuestions(defaultSuggestedQuestions);
        displayHistory();
    };

    // Expose privileged methods
    return {
        init : init
    };
}();