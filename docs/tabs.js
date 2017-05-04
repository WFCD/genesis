function openCommandTab(ele, tabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    ele.className += " active";
    window.location.hash = "#"+tabName;
}
window.onload = function() {
    // Gets the location hash
    tabName = window.location.hash.substring(1);
    // If there is no hash then stop executing
    if (tabName == "") {return;}
    // Get all the elements with class="tablinks"
    tablinks = document.getElementsByClassName("tablinks");
    // Iterates through the tablink elements
    for (i = 0; i < tablinks.length; i++) {
        // Gets the attribute for "onclick"
        onclik = tablinks[i].getAttribute("onclick");
        // If the attribute doesn't exist it will return null
        if (onclik != null) {
            // Remove the function and stuff
            tab = onclik.replace("openCommandTab(this, '", "").replace("')", "");
            // Checks if the hash matches the stripped attribute data
            if (tabName == tab) {
                // Changes to the correct tab
                openCommandTab(tablinks[i], tabName);
                break;
            }
        }
    }
};
