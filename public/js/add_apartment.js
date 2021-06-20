const apartmentForm = document.getElementById('apartment-form');
const apartmentID = document.getElementById('apartment-id');
const apartmentAddress = document.getElementById('apartment-address');
const apartmentPrice = document.getElementById('apartment-price');
const apartmentCurrency = document.getElementById('apartment-currency');

// Send POST to API to add apartment
async function addApartment(e) {
	e.preventDefault();

	if (apartmentID.value === '' || apartmentAddress.value === '' || apartmentPrice.value === '') {
		alert('Please fill in fields');
	} else {

		const sendBody = {
			apartmentID: apartmentID.value,
			address: apartmentAddress.value,
			price: {
				currency: apartmentCurrency.value,
				value: apartmentPrice.value
			}
		};

		try {
			// console.log(`Currency id ${apartment.apartmentID}`)
			const res = await fetch('/api/v1/apartments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(sendBody)
			});

			if (res.status === 400) {
				throw Error('Apartment already exists!');
			}

			alert('Apartment added!');
			window.location.href = '/index.html';
		} catch (err) {
			alert(err);
			return;
		}
	}
}

apartmentForm.addEventListener('submit', addApartment);