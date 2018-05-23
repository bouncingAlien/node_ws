function autocomplete(input, latInput, lngInput) {
    // if there is no input on the page, skip this function
    if (!input) return;
    const dropdown = new google.maps.places.Autocomplete(input);
    dropdown.addListener('place_changed', () => {
        const place = dropdown.getPlace();
        latInput.value = place.geometry.location.lat();
        lngInput.value = place.geometry.location.lng();
    });
    // stop enter to submit the form when dropdown is open
    input.on('keydown', (e) => {
        if (e.key = 13) {
            e.preventDefault();
        }
    });
}

export default autocomplete;