angular.module('angularPayments')

.directive('balancedForm', ['$window', '$parse', '$log', 'Common', function( $window, $parse, $log, Common )  {
    
  // directive intercepts form-submission, obtains Balenced's token using balanced.js
  // and then passes that to callback provided in balancedForm, attribute.

  // data that is sent to balanced is filtered from scope, looking for valid values to
  // send and converting camelCase to snake_case, e.g expMonth -> exp_month


  // filter valid sensitive values from scope and convert them from camelCase to snake_case
  _getDataToSend = function(data){
           
    var possibleKeys = ['number', 'expMonth', 'expYear', 
                    'cvc', 'name','addressLine1', 
                    'addressLine2', 'addressCity',
                    'addressState', 'addressZip',
                    'addressCountry']
    
    var camelToSnake = function(str){
      return str.replace(/([A-Z])/g, function(m){
        return "_"+m.toLowerCase();
      });
    }

    var ret = {};

    for(i in possibleKeys){
        if(possibleKeys.hasOwnProperty(i)){
            ret[camelToSnake(possibleKeys[i])] = angular.copy(data[possibleKeys[i]]);
        }
    }

    ret['number'] = ret['number'].replace(/ /g,'');

    return ret;
  }

  return {
    restrict: 'A',
    link: function(scope, elem, attr) {
      if(!$window.balanced){
          throw 'balancedForm requires that you have balanced.js installed. Include https://js.balancedpayments.com/v1/balanced.js into your html.';
      }

      var form = angular.element(elem);

      form.bind('submit', function() {

        expMonthUsed = scope.expMonth ? true : false;
        expYearUsed = scope.expYear ? true : false;

        if(!(expMonthUsed && expYearUsed)){
          exp = Common.parseExpiry(scope.expiry)
          scope.expMonth = exp.month
          scope.expYear = exp.year
        }

        var button = form.find('button');
        button.prop('disabled', true);

        if(form.hasClass('ng-valid'))
		{  
		  	var dataToSend = _getDataToSend(scope);
			var creditCardData = {
			    card_number: dataToSend.number,
			    expiration_month: dataToSend.exp_month,
			    expiration_year: dataToSend.exp_year,
			    security_code: dataToSend.cvc,
				name: dataToSend.name,
				postal_code: dataToSend.addressZip
			 };
			
			balanced.card.create( creditCardData, function() 
			{
	            var args = arguments;
	            scope.$apply(function() {
	              scope[attr.balancedForm].apply(scope, args);
	            });
			} );

        }
		else
		{
			scope.$apply(function() {
            scope[attr.balancedForm].apply( scope, { status:400, error:'Invalid form submitted.' } );
          });
          button.prop('disabled', false);
        }

        scope.expiryMonth = expMonthUsed ? scope.expMonth : null;
        scope.expiryYear = expYearUsed ? scope.expMonth : null;

      });
    }
  }
}])
