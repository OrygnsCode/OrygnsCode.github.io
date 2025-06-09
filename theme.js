$(document).ready(function() {
    // Apply theme on page load
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        $('body').addClass('dark-mode');
        // Initialize switch to 'night' state visually
        gsap.set("#sun", {opacity: 0, x: -157});
        gsap.set("#cloud", {opacity: 0});
        gsap.set("#moon", {opacity: 1, x: -157, rotation:0}); // rotation:0 or -360 depending on desired start
        gsap.set(".star", {opacity: 1});
        $('#night').css({'background': '#224f6d', 'border-color': '#cad4d8'});
        $('#background').css({'background': '#0d1f2b'});
        $('#day').css({'pointer-events': 'none'});
        $('#night').css({'pointer-events': 'all'});
    } else {
        $('body').removeClass('dark-mode');
        // Initialize switch to 'day' state
        $('#day').css({'pointer-events': 'all'});
        $('#night').css({'pointer-events': 'none'});
        localStorage.setItem('theme', 'light'); // Default to light if no theme set
    }

    // GSAP Timelines for animations
    var tl = gsap.timeline({defaults:{ease: "power2.out"}})
    var tr = gsap.timeline({defaults:{ease: "power2.out"}})

    $("#day").click(function(){
        $('body').addClass('dark-mode');
        localStorage.setItem('theme', 'dark');

        tr.to("#sun",{opacity:0, x: -157, duration:.6})
        tr.to("#cloud",{opacity:0, duration:.6}, "<")
        tr.to("#moon",{opacity:1, x: -157, duration:.6, rotation:0}, "<") // Ensure moon rotation is reset if it was > 0
        tr.to(".star",{opacity:1, duration:.6}, "<")
        // Change background colors for night
        $('#night').css({'background': '#224f6d', 'border-color': '#cad4d8'});
        $('#background').css({'background': '#0d1f2b'});
        setTimeout(function(){
            $('#day').css({'pointer-events': 'none'});
            $('#night').css({'pointer-events': 'all'});
        }, 600); // Match duration of the longest animation
    });

    $("#night").click(function(){
        $('body').removeClass('dark-mode');
        localStorage.setItem('theme', 'light');

        tl.to("#moon",{opacity:0, x:0, duration:.6, rotation: 360}) // Rotate moon during transition
        tl.to(".star",{opacity:0, duration:.6}, "<")
        tl.to("#sun",{opacity:1, x: -73, duration:.6}, "<") // Sun moves to its original position
        tl.to("#cloud",{opacity:1, duration:.6}, "<")
        // Change background colors for day
        $('#day').css({'background': '#9cd6ef', 'border-color': '#65c0e7'}); // Reset day colors
        $('#background').css({'background': '#d3edf8'}); // Reset background for day
        setTimeout(function(){
            $('#day').css({'pointer-events': 'all'});
            $('#night').css({'pointer-events': 'none'});
        }, 600); // Match duration of the longest animation
    });
});
