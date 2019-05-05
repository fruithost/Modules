<?php

namespace Aurora\Modules\MailTnefWebclientPlugin\Classes;

class TNEF {

	public $debug		= false;
	public $download	= false;

	public $TNEF_SIGNATURE						= 0x223e9f78;
	public $TNEF_LVL_MESSAGE					= 0x01;
	public $TNEF_LVL_ATTACHMENT					= 0x02;
	
	public $TNEF_STRING							= 0x00010000;
	public $TNEF_TEXT							= 0x00020000;
	public $TNEF_BYTE							= 0x00060000;
	public $TNEF_WORD							= 0x00070000;
	public $TNEF_DWORD							= 0x00080000;
	
	public $TNEF_ASUBJECT						= 0;
	public $TNEF_AMCLASS						= 0;
	public $TNEF_BODYTEXT						= 0;
	public $TNEF_ATTACHDATA						= 0;
	public $TNEF_AFILENAME						= 0;
	public $TNEF_ARENDDATA						= 0;
	public $TNEF_AMAPIATTRS						= 0;
	public $TNEF_AVERSION						= 0;
	
	public $TNEF_MAPI_NULL						= 0x0001;
	public $TNEF_MAPI_SHORT						= 0x0002;
	public $TNEF_MAPI_INT						= 0x0003;
	public $TNEF_MAPI_FLOAT						= 0x0004;
	public $TNEF_MAPI_DOUBLE					= 0x0005;
	public $TNEF_MAPI_CURRENCY					= 0x0006;
	public $TNEF_MAPI_APPTIME					= 0x0007;
	public $TNEF_MAPI_ERROR						= 0x000a;
	public $TNEF_MAPI_BOOLEAN					= 0x000b;
	public $TNEF_MAPI_OBJECT					= 0x000d;
	public $TNEF_MAPI_INT8BYTE					= 0x0014;
	public $TNEF_MAPI_STRING					= 0x001e;
	public $TNEF_MAPI_UNICODE_STRING			= 0x001f;
	public $TNEF_MAPI_SYSTIME					= 0x0040;
	public $TNEF_MAPI_CLSID						= 0x0048;
	public $TNEF_MAPI_BINARY					= 0x0102;
	
	public $TNEF_MAPI_ATTACH_MIME_TAG			= 0x370E;
	public $TNEF_MAPI_ATTACH_LONG_FILENAME		= 0x3707;
	public $TNEF_MAPI_ATTACH_DATA				= 0x3701;
	
    public $TNEF_MAPI_NAMED_TYPE_ID				= 0x0000;
    public $TNEF_MAPI_NAMED_TYPE_STRING			= 0x0001;
    public $TNEF_MAPI_MV_FLAG					= 0x1000;
	
	
	public function __construct() {
		$this->TNEF_ASUBJECT					= $this->TNEF_DWORD	 | 0x8004;
		$this->TNEF_AMCLASS						= $this->TNEF_WORD	 | 0x8008;
		$this->TNEF_BODYTEXT					= $this->TNEF_TEXT	 | 0x800c;
		$this->TNEF_ATTACHDATA					= $this->TNEF_BYTE	 | 0x800f;
		$this->TNEF_AFILENAME					= $this->TNEF_STRING | 0x8010;
		$this->TNEF_ARENDDATA					= $this->TNEF_BYTE	 | 0x9002;
		$this->TNEF_AMAPIATTRS					= $this->TNEF_BYTE	 | 0x9005;
		$this->TNEF_AVERSION					= $this->TNEF_DWORD	 | 0x9006;
	}
	
	public function getx($size, &$buf) {
        $value = null;

        if (strlen($buf) >= $size) {
            $value = substr($buf, 0, $size);
            $buf = substr_replace($buf, '', 0, $size);
        }

        return $value;
	}
	
	public function geti(&$buf, $size) {
        $bytes = $size / 8;
        $value = null;

        if (strlen($buf) >= $bytes) {
            $value = ord($buf[0]);
            if ($bytes >= 2) {
                $value += (ord($buf[1]) << 8);
            }
            if ($bytes >= 4) {
                $value += (ord($buf[2]) << 16) + (ord($buf[3]) << 24);
            }
            $buf = substr_replace($buf, '', 0, $bytes);
        }

        return $value;
	}
	
	public function decode_attribute($attribute, &$buf) {
		$length = $this->geti($buf, 32);
		$value = $this->getx($length, $buf); //data
		$this->geti($buf, 16); //checksum
		if ($this->debug) {
			printf("ATTRIBUTE[%08x] %d bytes\n", $attribute, $length);
			\CApi::Log(sprintf("ATTRIBUTE[%08x] %d bytes\n", $attribute, $length), \ELogLevel::Full, 'tnef-');
		}
		switch($attribute) {
		case $this->TNEF_BODYTEXT:
			if (!$this->download) {
				//printf("<b>Embedded message:</b><pre>%s</pre>",$value);
			}
		default:
		}
	}

	public function extract_mapi_attrs($buf, &$attachment_data) {

		$number = $this->geti($buf, 32); // number of attributes
		while(strlen($buf) > 0 && $number--) {
            $have_length = false;
            $named_id = null;
			$value = null;
			$length = 1;
			$attr_type = $this->geti($buf, 16);
			$attr_name = $this->geti($buf, 16);
			
			if ($this->debug) {
				printf("mapi attribute: %04x:%04x\n", $attr_type, $attr_name);
				\CApi::Log(sprintf("mapi attribute: %04x:%04x\n", $attr_type, $attr_name), \ELogLevel::Full, 'tnef-');
			}
			
            if (($attr_type & $this->TNEF_MAPI_MV_FLAG) != 0) {
                $have_length = true;
                $attr_type = $attr_type & ~$this->TNEF_MAPI_MV_FLAG;
            }

            if (($attr_name >= 0x8000) && ($attr_name < 0xFFFE)) {
                $this->getx(16, $buf);
                $named_type = $this->geti($buf, 32);

                switch ($named_type) {
                case $this->TNEF_MAPI_NAMED_TYPE_ID:
                    $named_id = $this->geti($buf, 32);
                    $attr_name = $named_id;
                    break;

                case $this->TNEF_MAPI_NAMED_TYPE_STRING:
                    $attr_name = 0x9999;
                    $idlen = $this->geti($buf, 32);
                    $datalen = $idlen + ((4 - ($idlen % 4)) % 4);
                    $named_id = substr($this->getx($datalen, $buf), 0, $idlen);
                    break;
                }
            }

            if ($have_length) {
                $value = $this->geti($buf, 32);
            }			
			
			switch($attr_type) {
				case $this->TNEF_MAPI_SHORT:
					$value = $this->geti($buf, 16);
					break;

				case $this->TNEF_MAPI_INT:
				case $this->TNEF_MAPI_BOOLEAN:
					$value = $this->geti($buf, 32);
					break;
				case $this->TNEF_MAPI_FLOAT:
					$value = $this->getx(4, $buf);
					break;

				case $this->TNEF_MAPI_DOUBLE:
				case $this->TNEF_MAPI_SYSTIME:
					$value = $this->getx(8, $buf);
					break;

				case $this->TNEF_MAPI_STRING:
				case $this->TNEF_MAPI_UNICODE_STRING:
				case $this->TNEF_MAPI_BINARY:
				case $this->TNEF_MAPI_OBJECT:
					$num_vals = $this->geti($buf, 32);
					for ($i = 0; $i < $num_vals; $i++) {
						$length = $this->geti($buf, 32);
						$buflen = $length + ((4 - ($length % 4)) % 4);

						if ($attr_type == $this->TNEF_MAPI_STRING) {
							--$length;
						}

						$value = substr($this->getx($buflen, $buf), 0, $length);
					}
					break;

				default:
					if ($this->debug) {
						echo("Unknown mapi attribute!\n");
						\CApi::Log('Unknown mapi attribute!\n', \ELogLevel::Full, 'tnef-');
					}
			}
			
			// store any interesting attributes
			switch($attr_name) {
			case $this->TNEF_MAPI_ATTACH_LONG_FILENAME: // used in preference to AFILENAME value
				$attachment_data[0]['name'] = preg_replace('/.*[\/](.*)$/', '\1', $value); // strip path
				break;
			
			case $this->TNEF_MAPI_ATTACH_MIME_TAG: // Is this ever set, and what is format?
				$attachment_data[0]['type0'] = preg_replace('/^(.*)\/.*/', '\1', $value);
				$attachment_data[0]['type1'] = preg_replace('/.*\/(.*)$/', '\1', $value);
				break;
			
			case $this->TNEF_MAPI_ATTACH_DATA:
				$this->getx(16, $value); // skip the next 16 bytes (unknown data)
				array_shift($attachment_data); // eliminate the current (bogus) attachment
			
				$this->do_tnef_decode($value, $attachment_data); // recursively process the attached message
	
				break;
			default:
	
			}
		}
	}
	
	public function decode_message(&$buf) {
		if ($this->debug) {
			echo("MESSAGE ");
			\CApi::Log('MESSAGE ', \ELogLevel::Full, 'tnef-');
		}
		$attribute = $this->geti($buf, 32);
		$this->decode_attribute($attribute, $buf);
	}	
	
	public function decode_attachment(&$buf, &$attachment_data) {
	
		if ($this->debug) {
			echo("ATTACHMENT ");
			\CApi::Log('ATTACHMENT ', \ELogLevel::Full, 'tnef-');
		}
		$attribute = $this->geti($buf, 32);
		switch($attribute) {	
		case $this->TNEF_ARENDDATA: // marks start of new attachment
			$length = $this->geti($buf, 32);
			$this->getx($length, $buf);
			$this->geti($buf, 16); //checksum
			if ($this->debug) {
				printf("ARENDDATA[%08x]: %d bytes\n", $attribute, $length);
				\CApi::Log(sprintf("ARENDDATA[%08x]: %d bytes\n", $attribute, $length), \ELogLevel::Full, 'tnef-');
			}
			// add a new default data block to hold details of this attachment
			// reverse order is easier to handle later!
			array_unshift($attachment_data, array('type0'  => 'application',
													'type1'	 => 'octet-stream',
													'name'	 => 'unknown',
													'stream' => ''));
			break;
		
		case $this->TNEF_AFILENAME: // filename
			$length = $this->geti($buf, 32);
			$attachment_data[0]['name'] = preg_replace('/.*[\/](.*)$/',
														'\1',
														$this->getx($length, $buf)); // strip path
			$this->geti($buf, 16); //checksum
			if ($this->debug) {
				printf("AFILENAME[%08x]: %s\n", $attribute, $attachment_data[0]['name']);
				\CApi::Log(sprintf("AFILENAME[%08x]: %s\n", $attribute, $attachment_data[0]['name']), \ELogLevel::Full, 'tnef-');
			}
			break;
		
		case $this->TNEF_ATTACHDATA: // the attachment itself
			$length = $this->geti($buf, 32);
			$attachment_data[0]['size'] = $length;
			$attachment_data[0]['stream'] = $this->getx($length, $buf);
			$this->geti($buf, 16); //checksum
			if ($this->debug) {
				printf("ATTACHDATA[%08x]: %d bytes\n", $attribute, $length);
				\CApi::Log(sprintf("ATTACHDATA[%08x]: %d bytes\n", $attribute, $length), \ELogLevel::Full, 'tnef-');
			}
			break;
		
		case $this->TNEF_AMAPIATTRS:
			$length = $this->geti($buf, 32);
			$value = $this->getx($length, $buf);
			$this->geti($buf, 16); //checksum
			if ($this->debug) {
				printf("AMAPIATTRS[%08x]: %d bytes\n", $attribute, $length);
				\CApi::Log(sprintf("AMAPIATTRS[%08x]: %d bytes\n", $attribute, $length), \ELogLevel::Full, 'tnef-');
			}
			$this->extract_mapi_attrs($value, $attachment_data);
			break;
		
		default:
			$this->decode_attribute($attribute, $buf);
		}
	}
	
	public function do_tnef_decode(&$buf, &$attachment_data) {
		$tnef_signature = $this->geti($buf, 32);
		if ($tnef_signature == $this->TNEF_SIGNATURE) {
			$tnef_key = $this->geti($buf, 16);
			if ($this->debug) {
				printf("Signature: 0x%08x\nKey: 0x%04x\n", $tnef_signature, $tnef_key);
				\CApi::Log(sprintf("Signature: 0x%08x\nKey: 0x%04x\n", $tnef_signature, $tnef_key), \ELogLevel::Full, 'tnef-');
			}
		
			while (strlen($buf) > 0) {
				$lvl_type = $this->geti($buf, 8);
				switch($lvl_type) {
				case $this->TNEF_LVL_MESSAGE:
					$this->decode_message($buf);
					break;
		
				case $this->TNEF_LVL_ATTACHMENT:
					$this->decode_attachment($buf, $attachment_data);
					break;
				default:
					if ($this->debug) {
						echo("Invalid file format!");
						\CApi::Log('Invalid file format!', \ELogLevel::Full, 'tnef-');
					}
					break 2;
				}
			}
		} else {
			if ($this->debug) {
				echo("Invalid file format!");
				\CApi::Log('Invalid file format!', \ELogLevel::Full, 'tnef-');
			}
		}
	}
	
	public function Decode($buf) {
		$attachment_data = array();
		if ($this->debug) {
			echo("<pre>");
		}
		$this->do_tnef_decode($buf, $attachment_data);
		if ($this->debug) {
			echo("</pre>");
		}
		return array_reverse($attachment_data);
	}
}


