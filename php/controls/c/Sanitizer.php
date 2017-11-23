<?php
    namespace CJControl;
    
    class Sanitizer
    {
        private $sanitized;
                
        function url ($url) {
            $url = filter_var($url, FILTER_SANITIZE_URL);
            // Validate url
            if (!filter_var($url, FILTER_VALIDATE_URL) === false) {
                return true;//echo("$url is a valid URL");
            } else {
                return false;//echo("$url is not a valid URL");
            }
        }
        function email ($email) {
            // john.doe@example.com
            // Remove all illegal characters from email
            $email = filter_var($email, FILTER_SANITIZE_EMAIL);
            // Validate e-mail
            if (!filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
                return true;//echo("$email is a valid email address");
            } else {
                return false;//echo("$email is not a valid email address");
            }
        }
        function ip ($ip) {
            // 127.0.0.1;
            if (!filter_var($ip, FILTER_VALIDATE_IP) === false) {
                return true;//echo("$ip is a valid IP address");
            } else {
                return false;//echo("$ip is not a valid IP address");
            }
        }
        function int ($int) {
            // 0;
            if (filter_var($int, FILTER_VALIDATE_INT) === 0 ||
                !filter_var($int, FILTER_VALIDATE_INT) === false) {
                return true;//echo("Integer is valid");
            } else {
                return false;//echo("Integer is not valid");
            }
        }
        function string ($var) {
            // Hello World!";
            $newstr = filter_var($var, FILTER_SANITIZE_STRING);
            return $newstr;
        }
        function password ($str) {
            // Hello World!";
            $newstr = filter_var($str, FILTER_SANITIZE_STRING);
            return $newstr;
        }
        function digits ($var) {
            // Hello World!";
            $sane = filter_var($var, FILTER_SANITIZE_STRING);
            return $sane;
        }
        function name ($var) {
            // name can contain only alpha characters and space
            if (preg_match("/^[a-zA-Z ]+$/", $var)) {
                return $var;
                //$name_error = "Name must contain only alphabets and space";
            } else {
                return false;
            }
        }
        
        function run ($var, $format)
        {
            // determine the sanitize to use            
            switch (strtolower($format)) {
                case "string":
                    $this->sanitized = $this->string($var);
                    break;
                case "name":
                    $this->sanitized = $this->name($var);
                    break;
                case "digits":
                    $this->sanitized = $this->digits($var);
                    break;
                case "password":
                    $this->sanitized = $this->password($var);
                    break;
                case "url":
                    $this->sanitized = $this->url($var);
                    break;
                case "email":
                    $this->sanitized = $this->email($var);
                    break;
                case "ip":
                    $this->sanitized = $this->ip($var);
                    break;
                case "integer":
                    $this->sanitized = $this->int($var);
                    break;
                /*case "boolean":
                    $this->sanitized = $this->boolean($var);
                 * break;
                  case "double":
                    $this->sanitized = $this->double($var);
                    break;
                case "money":
                    $this->sanitized = $this->money($var);
                    break;*/
            }
            return $this->sanitized;
        }
    }
/*
     * FILTER_VALIDATE_BOOLEAN	"boolean"	default	FILTER_NULL_ON_FAILURE	
Returns TRUE for "1", "true", "on" and "yes". Returns FALSE otherwise.

If FILTER_NULL_ON_FAILURE is set, FALSE is returned only for "0", "false", "off", "no", and "", and NULL is returned for all non-boolean values.

FILTER_VALIDATE_EMAIL	"validate_email"	default	FILTER_FLAG_EMAIL_UNICODE	
Validates whether the value is a valid e-mail address.

In general, this validates e-mail addresses against the syntax in RFC 822, with the exceptions that comments and whitespace folding and dotless domain names are not supported.

FILTER_VALIDATE_FLOAT	"float"	default, decimal	FILTER_FLAG_ALLOW_THOUSAND	Validates value as float, and converts to float on success.
FILTER_VALIDATE_INT	"int"	default, min_range, max_range	FILTER_FLAG_ALLOW_OCTAL, FILTER_FLAG_ALLOW_HEX	Validates value as integer, optionally from the specified range, and converts to int on success.
FILTER_VALIDATE_IP	"validate_ip"	default	FILTER_FLAG_IPV4, FILTER_FLAG_IPV6, FILTER_FLAG_NO_PRIV_RANGE, FILTER_FLAG_NO_RES_RANGE	Validates value as IP address, optionally only IPv4 or IPv6 or not from private or reserved ranges.
FILTER_VALIDATE_MAC	"validate_mac_address"	default	 	Validates value as MAC address.
FILTER_VALIDATE_REGEXP	"validate_regexp"	default, regexp	 	Validates value against regexp, a Perl-compatible regular expression.
FILTER_VALIDATE_URL	"validate_url"	default	FILTER_FLAG_SCHEME_REQUIRED, FILTER_FLAG_HOST_REQUIRED, FILTER_FLAG_PATH_REQUIRED, FILTER_FLAG_QUERY_REQUIRED	Validates value as URL (according to » http://www.faqs.org/rfcs/rfc2396), optionally with required components. Beware a valid URL may not specify the HTTP protocol http:// so further validation may be required to determine the URL uses an expected protocol, e.g. ssh:// or mailto:. Note that the function will only find ASCII URLs to be valid; internationalized domain names (containing non-ASCII characters) will fail.
Note:
As of PHP 5.4.11, the numbers +0 and -0 validate as both integers as well as floats (using FILTER_VALIDATE_FLOAT and FILTER_VALIDATE_INT). Before PHP 5.4.11 they only validated as floats (using FILTER_VALIDATE_FLOAT).
When default is set to option, default's value is used if value is not validated.
     */
    
/*
 * Sanitize filters ¶

List of filters for sanitization
ID	Name	Flags	Description
FILTER_SANITIZE_EMAIL	"email"	 	Remove all characters except letters, digits and !#$%&'*+-=?^_`{|}~@.[].
FILTER_SANITIZE_ENCODED	"encoded"	FILTER_FLAG_STRIP_LOW, FILTER_FLAG_STRIP_HIGH, FILTER_FLAG_STRIP_BACKTICK, FILTER_FLAG_ENCODE_LOW, FILTER_FLAG_ENCODE_HIGH	URL-encode string, optionally strip or encode special characters.
FILTER_SANITIZE_MAGIC_QUOTES	"magic_quotes"	 	Apply addslashes().
FILTER_SANITIZE_NUMBER_FLOAT	"number_float"	FILTER_FLAG_ALLOW_FRACTION, FILTER_FLAG_ALLOW_THOUSAND, FILTER_FLAG_ALLOW_SCIENTIFIC	Remove all characters except digits, +- and optionally .,eE.
FILTER_SANITIZE_NUMBER_INT	"number_int"	 	Remove all characters except digits, plus and minus sign.
FILTER_SANITIZE_SPECIAL_CHARS	"special_chars"	FILTER_FLAG_STRIP_LOW, FILTER_FLAG_STRIP_HIGH, FILTER_FLAG_STRIP_BACKTICK, FILTER_FLAG_ENCODE_HIGH	HTML-escape '"<>& and characters with ASCII value less than 32, optionally strip or encode other special characters.
FILTER_SANITIZE_FULL_SPECIAL_CHARS	"full_special_chars"	FILTER_FLAG_NO_ENCODE_QUOTES,	Equivalent to calling htmlspecialchars() with ENT_QUOTES set. Encoding quotes can be disabled by setting FILTER_FLAG_NO_ENCODE_QUOTES. Like htmlspecialchars(), this filter is aware of the default_charset and if a sequence of bytes is detected that makes up an invalid character in the current character set then the entire string is rejected resulting in a 0-length string. When using this filter as a default filter, see the warning below about setting the default flags to 0.
FILTER_SANITIZE_STRING	"string"	FILTER_FLAG_NO_ENCODE_QUOTES, FILTER_FLAG_STRIP_LOW, FILTER_FLAG_STRIP_HIGH, FILTER_FLAG_STRIP_BACKTICK, FILTER_FLAG_ENCODE_LOW, FILTER_FLAG_ENCODE_HIGH, FILTER_FLAG_ENCODE_AMP	Strip tags, optionally strip or encode special characters.
FILTER_SANITIZE_STRIPPED	"stripped"	 	Alias of "string" filter.
FILTER_SANITIZE_URL	"url"	 	Remove all characters except letters, digits and $-_.+!*'(),{}|\\^~[]`<>#%";/?:@&=.
FILTER_UNSAFE_RAW	"unsafe_raw"	FILTER_FLAG_STRIP_LOW, FILTER_FLAG_STRIP_HIGH, FILTER_FLAG_STRIP_BACKTICK, FILTER_FLAG_ENCODE_LOW, FILTER_FLAG_ENCODE_HIGH, FILTER_FLAG_ENCODE_AMP	Do nothing, optionally strip or encode special characters. This filter is also aliased to FILTER_DEFAULT.
Warning
When using one of these filters as a default filter either through your ini file or through your web server's configuration, the default flags is set to FILTER_FLAG_NO_ENCODE_QUOTES. You need to explicitly set filter.default_flags to 0 to have quotes encoded by default. Like this:
Example #1 Configuring the default filter to act like htmlspecialchars
filter.default = full_special_chars
filter.default_flags = 0
Changelog

Version	Description
5.2.11/5.3.1	Slashes (/) are removed by FILTER_SANITIZE_EMAIL. Prior they were retained.
add a note add a note
User Contributed Notes 13 notes

up
down
34 Anonymous ¶1 year ago
FILTER_SANITIZE_STRING doesn't behavior the same as strip_tags function.    strip_tags allows less than symbol inferred from context, FILTER_SANITIZE_STRING strips regardless.
<?php
$smaller = "not a tag < 5";
echo strip_tags($smaller);    // -> not a tag < 5
echo filter_var ( $smaller, FILTER_SANITIZE_STRING); // -> not a tag
?>
up
down
42 googlybash24 at aol dot com ¶4 years ago
Remember to trim() the $_POST before your filters are applied:

<?php

// We trim the $_POST data before any spaces get encoded to "%20"

// Trim array values using this function "trim_value"
function trim_value(&$value)
{
    $value = trim($value);    // this removes whitespace and related characters from the beginning and end of the string
}
array_filter($_POST, 'trim_value');    // the data in $_POST is trimmed

$postfilter =    // set up the filters to be used with the trimmed post array
    array(
            'user_tasks' => array('filter' => FILTER_SANITIZE_STRING, 'flags' => !FILTER_FLAG_STRIP_LOW),    // removes tags. formatting code is encoded -- add nl2br() when displaying
            'username'                            =>    array('filter' => FILTER_SANITIZE_ENCODED, 'flags' => FILTER_FLAG_STRIP_LOW),    // we are using this in the url
            'mod_title'                            =>    array('filter' => FILTER_SANITIZE_ENCODED, 'flags' => FILTER_FLAG_STRIP_LOW),    // we are using this in the url
        );

$revised_post_array = filter_var_array($_POST, $postfilter);    // must be referenced via a variable which is now an array that takes the place of $_POST[]
echo (nl2br($revised_post_array['user_tasks']));    //-- use nl2br() upon output like so, for the ['user_tasks'] array value so that the newlines are formatted, since this is our HTML <textarea> field and we want to maintain newlines
?>
up
down
14 david dot drakulovski at gmail dot com ¶3 years ago
Here is a simpler and a better presented ASCII list for the <32 or 127> filters 
(if wikipedia confused the hell out of you):

http://www.danshort.com/ASCIImap/
up
down
11 Willscrlt ¶1 year ago
To include multiple flags, simply separate the flags with vertical pipe symbols.

For example, if you want to use filter_var() to sanitize $string with FILTER_SANITIZE_STRING and pass in FILTER_FLAG_STRIP_HIGH and FILTER_FLAG_STRIP_LOW, just call it like this:

$string = filter_var($string, FILTER_SANITIZE_STRING, FILTER_FLAG_STRIP_HIGH | FILTER_FLAG_STRIP_LOW);

The same goes for passing a flags field in an options array in the case of using callbacks.

$var = filter_var($string, FILTER_SANITIZE_SPECIAL_CHARS,
array('flags' => FILTER_FLAG_STRIP_LOW | FILTER_FLAG_ENCODE_HIGH));

Thanks to the Brain Goo blog at popmartian.com/tipsntricks/for this info.
up
down
14 galvao at galvao dot eti dot br ¶4 years ago
Just to clarify, since this may be unknown for a lot of people: 

ASCII characters above 127 are known as "Extended" and they represent characters such as greek letters and accented letters in latin alphabets, used in languages such as pt_BR. 

A good ASCII quick reference (aside from the already mentioned Wikipedia article) can be found at: http://www.asciicodes.com/
up
down
6 AntonioPrimera ¶1 year ago
Please be aware that when using filter_var() with FILTER_SANITIZE_NUMBER_FLOAT and FILTER_SANITIZE_NUMBER_INT the result will be a string, even if the input value is actually a float or an int.

Use FILTER_VALIDATE_FLOAT and FILTER_VALIDATE_INT, which will convert the result to the expected type.
up
down
14 marcus at synchromedia dot co dot uk ¶7 years ago
It's not entirely clear what the LOW and HIGH ranges are. LOW is characters below 32, HIGH is those above 127, i.e. outside the ASCII range.

<?php
$a = "\tcafé\n";
//This will remove the tab and the line break
echo filter_var($a, FILTER_SANITIZE_STRING, FILTER_FLAG_STRIP_LOW);
//This will remove the é.
echo filter_var($a, FILTER_SANITIZE_STRING, FILTER_FLAG_STRIP_HIGH);
?>
     */
    
/*
 * Filter flags ¶

List of filter flags
ID	Used with	Description
FILTER_FLAG_STRIP_LOW	FILTER_SANITIZE_ENCODED, FILTER_SANITIZE_SPECIAL_CHARS, FILTER_SANITIZE_STRING, FILTER_UNSAFE_RAW	Strips characters that have a numerical value <32.
FILTER_FLAG_STRIP_HIGH	FILTER_SANITIZE_ENCODED, FILTER_SANITIZE_SPECIAL_CHARS, FILTER_SANITIZE_STRING, FILTER_UNSAFE_RAW	Strips characters that have a numerical value >127.
FILTER_FLAG_STRIP_BACKTICK	FILTER_SANITIZE_ENCODED, FILTER_SANITIZE_SPECIAL_CHARS, FILTER_SANITIZE_STRING, FILTER_UNSAFE_RAW	Strips backtick characters.
FILTER_FLAG_ALLOW_FRACTION	FILTER_SANITIZE_NUMBER_FLOAT	Allows a period (.) as a fractional separator in numbers.
FILTER_FLAG_ALLOW_THOUSAND	FILTER_SANITIZE_NUMBER_FLOAT, FILTER_VALIDATE_FLOAT	Allows a comma (,) as a thousands separator in numbers.
FILTER_FLAG_ALLOW_SCIENTIFIC	FILTER_SANITIZE_NUMBER_FLOAT	Allows an e or E for scientific notation in numbers.
FILTER_FLAG_NO_ENCODE_QUOTES	FILTER_SANITIZE_STRING	If this flag is present, single (') and double (") quotes will not be encoded.
FILTER_FLAG_ENCODE_LOW	FILTER_SANITIZE_ENCODED, FILTER_SANITIZE_STRING, FILTER_SANITIZE_RAW	Encodes all characters with a numerical value <32.
FILTER_FLAG_ENCODE_HIGH	FILTER_SANITIZE_ENCODED, FILTER_SANITIZE_SPECIAL_CHARS, FILTER_SANITIZE_STRING, FILTER_SANITIZE_RAW	Encodes all characters with a numerical value >127.
FILTER_FLAG_ENCODE_AMP	FILTER_SANITIZE_STRING, FILTER_SANITIZE_RAW	Encodes ampersands (&).
FILTER_NULL_ON_FAILURE	FILTER_VALIDATE_BOOLEAN	Returns NULL for unrecognized boolean values.
FILTER_FLAG_ALLOW_OCTAL	FILTER_VALIDATE_INT	Regards inputs starting with a zero (0) as octal numbers. This only allows the succeeding digits to be 0-7.
FILTER_FLAG_ALLOW_HEX	FILTER_VALIDATE_INT	Regards inputs starting with 0x or 0X as hexadecimal numbers. This only allows succeeding characters to be a-fA-F0-9.
FILTER_FLAG_EMAIL_UNICODE	FILTER_VALIDATE_EMAIL	Allows the local part of the email address to contain Unicode characters.
FILTER_FLAG_IPV4	FILTER_VALIDATE_IP	Allows the IP address to be in IPv4 format.
FILTER_FLAG_IPV6	FILTER_VALIDATE_IP	Allows the IP address to be in IPv6 format.
FILTER_FLAG_NO_PRIV_RANGE	FILTER_VALIDATE_IP	
Fails validation for the following private IPv4 ranges: 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16.

Fails validation for the IPv6 addresses starting with FD or FC.

FILTER_FLAG_NO_RES_RANGE	FILTER_VALIDATE_IP	
Fails validation for the following reserved IPv4 ranges: 0.0.0.0/8, 169.254.0.0/16, 127.0.0.0/8 and 240.0.0.0/4.

Fails validation for the following reserved IPv6 ranges: ::1/128, ::/128, ::ffff:0:0/96 and fe80::/10.

FILTER_FLAG_SCHEME_REQUIRED	FILTER_VALIDATE_URL	Requires the URL to contain a scheme part.
FILTER_FLAG_HOST_REQUIRED	FILTER_VALIDATE_URL	Requires the URL to contain a host part.
FILTER_FLAG_PATH_REQUIRED	FILTER_VALIDATE_URL	Requires the URL to contain a path part.
FILTER_FLAG_QUERY_REQUIRED	FILTER_VALIDATE_URL	Requires the URL to contain a query string.
FILTER_REQUIRE_SCALAR		Requires the value to be scalar.
FILTER_REQUIRE_ARRAY		Requires the value to be an array.
FILTER_FORCE_ARRAY		If the value is a scalar, it is treated as array with the scalar value as only element.
Changelog

Version	Description
7.1.0	FILTER_FLAG_EMAIL_UNICODE has been added.
5.3.2	FILTER_FLAG_STRIP_BACKTICK has been added.
5.2.10	FILTER_FLAG_NO_RES_RANGE supports also IPv6 addresses.
     */
?>

