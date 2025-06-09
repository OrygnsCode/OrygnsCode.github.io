$(document).ready(function() {
    const currentTheme = localStorage.getItem('theme');

    function initializeDayState(animate) {
        if (animate) {
            gsap.to("#sun", 1, {x: 0, opacity: 1, ease: Power1.easeInOut});
            gsap.to("#cloud", 1, {opacity: 1, ease: Power1.easeInOut}); // Assuming cloud is part of day
            gsap.to("#moon", 1, {opacity: 0, x: 30, rotate: 360, transformOrigin: "center", ease: Power1.easeInOut});
            gsap.to(".star", 1, {opacity: 0, ease: Power1.easeInOut});
        } else {
            gsap.set("#sun, #cloud", {x: 0, opacity: 1});
            gsap.set("#moon", {x: 30, opacity: 0, rotate: 0}); // Start rotated if needed or just 0
            gsap.set(".star", {opacity: 0, x:0, y: -5}); // Stars start hidden, centered with moon's target
        }
        $('#day').css({'pointer-events': 'all'});
        $('#night').css({'pointer-events': 'none'});
        $('body').removeClass('dark-mode');
    }

    function initializeNightState(animate) {
        if (animate) {
            gsap.to("#sun", 1, {x: -30, opacity: 0, ease: Power1.easeInOut});
            gsap.to("#cloud", .5, {opacity: 0, ease: Power1.easeInOut}); // Assuming cloud is part of day
            gsap.to("#moon", 1, {x: 0, rotate: -360, transformOrigin: "center", opacity: 1, ease: Power1.easeInOut});
            gsap.to(".star", .5, {opacity: 1, x:0, y:-5, ease: Power1.easeInOut}); // Stars centered with moon
        } else {
            gsap.set("#moon, .star", {x: 0, opacity: 1});
            gsap.set(".star", {y: -5});
            gsap.set("#sun, #cloud", {x: -30, opacity: 0});
            gsap.set("#moon", {rotate: 0}); // Ensure moon rotation is reset
        }
        $('#night').css({'background': '#224f6d', 'border-color': '#cad4d8'}); // Style for night button base
        $('#day').css({'pointer-events': 'none'});
        $('#night').css({'pointer-events': 'all'});
        $('body').addClass('dark-mode');
    }

    if (currentTheme === 'dark') {
        initializeNightState(false); // Initialize to night state, no animation
    } else {
        initializeDayState(false); // Initialize to day state, no animation
        // localStorage.setItem('theme', 'light'); // Set if not already set, or ensure it is
    }

    $("#day").click(function(){
        initializeNightState(true); // Animate to night state
        localStorage.setItem('theme', 'dark');
        $(this).css({"pointer-events": "none"});
        setTimeout(function(){
            $("#night").css({"pointer-events": "all"})
        }, 1000);
    });

    $("#night").click(function(){
        initializeDayState(true); // Animate to day state
        localStorage.setItem('theme', 'light');
        // Reset night's inline styles if they were specific to dark mode and not covered by class
         $('#night').css({'background': '#9cd6ef', 'border-color': '#65c0e7'}); // Reset to day's version of night button
        $(this).css({"pointer-events": "none"});
        setTimeout(function(){
            $("#day").css({"pointer-events": "all"})
        }, 1000);
    });
});
