select distinct status_debito --, sum(valor_multa) 
from multas
where not status_debito like "%quitado%"